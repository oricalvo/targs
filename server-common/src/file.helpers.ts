import fs from "fs/promises";
import fsCallback, { createWriteStream } from "fs";
import path from "path";
import fsExtra from "fs-extra";
import yaml from "yaml";
import archiver from "archiver";
import { glob } from "glob";
import { parse as iniParse } from "ini";
import { createLogger } from "@oricalvo/common/dist/logger.js";
import { endsWithNewLine } from "@oricalvo/common/dist/string.helpers.js";
import { TaskQueue } from "./taskQueue.js";

const logger = createLogger("file.helpers");

export async function directoryExists(dirPath: string) {
    return new Promise(function (resolve, reject) {
        fsCallback.stat(dirPath, function (err, info) {
            if (err) {
                if (err.code == "ENOENT") {
                    return resolve(false);
                }

                reject(err);
            }

            resolve(true);
        });
    });
}

export async function fileExists(filePath: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fsCallback.stat(filePath, function (err, info) {
            if (err) {
                if (err.code == "ENOENT") {
                    resolve(false);
                    return;
                }

                reject(err);
                return;
            }

            resolve(true);
        });
    });
}

export function readBinaryFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
}

export function readTextFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, "utf8");
}

export async function readJsonFile<T = any>(filePath: string): Promise<T> {
    const text = await readTextFile(filePath);
    return JSON.parse(text);
}

export async function readIniFile(filePath: string): Promise<any> {
    const text = await readTextFile(filePath);
    return iniParse(text);
}

export function writeTextFile(filePath: string, content: string, ensureNewLineAtEOF: boolean = false): Promise<void> {
    logger.debug("writeTextFile", filePath);

    if (ensureNewLineAtEOF && !endsWithNewLine(content)) {
        content += "\n";
    }

    return fs.writeFile(filePath, content, "utf8");
}

export function writeBinaryFile(filePath: string, content: Buffer | Uint8Array): Promise<void> {
    logger.debug("writeBinaryFile", filePath);

    return fs.writeFile(filePath, content);
}

export async function deleteFile(filePath: string, force: boolean = false, noThrow: boolean = false): Promise<void> {
    logger.debug("deleteFile", filePath);

    try {
        await fs.rm(filePath, { force });
    } catch (err: any) {
        if (noThrow) {
            logger.warn(err);
            return;
        }

        throw err;
    }
}

export async function moveFile(source: string, dest: string) {
    await fs.rename(source, dest);
}

export async function writeJsonFile<T = any>(
    filePath: string,
    val: T,
    space?: string | number,
    addNewLineAtEOF: boolean = false
): Promise<void> {
    const text = JSON.stringify(val, null, space);

    await writeTextFile(filePath, text, addNewLineAtEOF);
}

export async function deleteDirectory(dirPath: string) {
    return new Promise<void>((resolve, reject) => {
        fsCallback.rm(dirPath, { force: true, recursive: true }, function (err) {
            if (err && err.code != "ENOENT") {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

//
//  Delete only the content of the directory (the directory itself remains)
//
export async function deleteDirectoryContent(dirPath: string) {
    logger.debug("deleteDirectoryContent", dirPath);

    if (!(await directoryExists(dirPath))) {
        return;
    }

    await fsExtra.emptyDir(dirPath);
}

export function isSubDirectory(parent: string, dir: string): boolean {
    const relative = path.relative(parent, dir);

    if (!relative) {
        return true;
    }

    return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function ensureDirectory(dirPath: string): Promise<void> {
    return await fsExtra.ensureDir(dirPath);
}

export async function copyFile(source: string, dest: string, createDest: boolean = false): Promise<void> {
    logger.debug("copyFile", source, dest);

    if (createDest) {
        const destDir = path.dirname(dest);
        await ensureDirectory(destDir);
    }

    await fs.copyFile(source, dest);
}

export async function copyFiles(files: string[], base: string, dest: string): Promise<void> {
    logger.debug("copyFiles", files.length, base, dest);

    await TaskQueue.runParallel(
        files,
        file => async () => {
            const relativeName = file.substring(base.length);
            await copyFile(file, path.posix.join(dest, relativeName), true);
        },
        25
    );
}

export async function readYamlFile<T>(filePath: string): Promise<T> {
    const yamlContent = await readTextFile(filePath);
    const json: T = yaml.parse(yamlContent);
    return json;
}

export async function createDirectory(dest: string, options?: CreateDirectoryOptions): Promise<void> {
    await fs.mkdir(dest, options);
}

export async function copyDirectory(source: string, dest: string): Promise<void> {
    await fsExtra.copy(source, dest);
}

export async function zipFilesToArchive(filesToArchive: string[], outZipFile: string) {
    logger.debug("zipFilesToArchive");

    //
    //  archiver ignores files that does not exist
    //  So we print here a warning
    //
    for (const filePath of filesToArchive) {
        if (!(await fileExists(filePath))) {
            logger.warn("File was not found:" + filePath);
        }
    }

    return new Promise<void>((resolve, reject) => {
        let err: Error | undefined;
        let outStreamIsFaulted: Error | undefined;
        let entryCount = 0;

        //
        //  Create a write stream
        //  We must handle carefully the closing (and waiting) of this stream, else, the zip file is invalid
        //
        const outStream = createWriteStream(outZipFile);

        outStream.on("error", function (e) {
            logger.debug("outStream onError");

            //
            //  Remember that the outStream itself is faulted
            //  In the case no close event is fired on the outStream
            //
            outStreamIsFaulted = e;
            err = e;

            //
            //  outStream error might occur during archive manipulation (for example, during append)
            //  So we need to abort any pending work
            //
            logger.debug("Aborting archive");
            archive.abort();
        });

        outStream.on("close", function () {
            logger.debug("outStream onClose");

            //
            //  We must wait for the close event, only then, we know for sure that all data was written to
            //  the file
            //  The problem is that a faulted outStream never fires a close event
            //
            onComplete();
        });

        const archive = archiver("zip", {
            zlib: { level: 9 },
        });
        archive.on("entry", function () {
            logger.debug("archiver onEntry");

            ++entryCount;
        });
        archive.on("finish", function () {
            logger.debug(`archiver onFinish, ${entryCount} entries`);

            onCleanup();
        });
        archive.on("error", function (e) {
            logger.debug("archive onError");

            err = e;

            onCleanup();
        });
        archive.pipe(outStream);

        for (const filePath of filesToArchive) {
            const fileName = path.basename(filePath);

            logger.debug("archiver file", fileName);
            archive.file(filePath, {
                name: fileName,
            });
        }

        logger.debug("archiver finalize");
        archive.finalize();

        function onCleanup() {
            logger.debug("Closing outStream");
            outStream.close();

            if (outStreamIsFaulted) {
                //
                //  close event on the outStream will never fire
                //
                onComplete();
            } else {
                //
                //  Do nothing and wait for the close event on the outStream
                //  Must wait for outStream close event so all data is written to the file
                //
            }
        }

        function onComplete() {
            if (err) {
                logger.debug("Rejecting");
                reject(err);
            } else {
                logger.debug("Resolving");
                resolve();
            }
        }
    });
}

export async function copyGlob(source: string, dest: string): Promise<void> {
    logger.debug("copyGlob", source, dest);

    const base = getGlobBase(source);
    const items = await glob(source);

    const files: string[] = await (async () => {
        const files: string[] = [];

        await TaskQueue.runParallel(
            items,
            item => async () => {
                const info = await fs.stat(item);
                if (info.isFile()) {
                    files.push(item);
                }
            },
            25
        );

        return files;
    })();

    return copyFiles(files, base!, dest);
}

export async function copyGlobMany(assets: CopyGlobItem[], basePath?: string): Promise<void> {
    logger.debug("copyGlobMany", assets.length);

    basePath = basePath || process.cwd();

    for (const asset of assets) {
        const source = path.resolve(basePath, asset.source);
        const target = path.resolve(basePath, asset.target);

        if (!getGlobBase(source)) {
            await copyFile(source, target, true);
        } else {
            await copyGlob(source, target);
        }
    }
}

function getGlobBase(pattern: string): string|null {
    let base = "";
    let hasMagic = false;

    const { tokens, seps } = splitGlob(pattern, "/\\");
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (!glob.hasMagic(token)) {
            if (i > 0) {
                base += seps[i];
            }

            base += token;
        } else {
            hasMagic = true;
            break;
        }
    }

    if (!hasMagic) {
        return null;
    }

    return base;
}

export function splitGlob(str: string, seps: string): { seps: string[]; tokens: string[] } {
    const tokens = [];
    const separators = [];
    let word = "";
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        const isSep = seps.indexOf(ch) != -1;
        if (isSep) {
            tokens.push(word);
            separators.push(ch);
            word = "";
        } else {
            word += ch;
        }
    }

    if (word) {
        tokens.push(word);
    }

    return {
        tokens,
        seps: separators,
    };
}

export async function getNearestFile(startingDirPath: string, fileName: string): Promise<string|null> {
    let dirPath = startingDirPath;

    while (true) {
        const filePath = path.resolve(dirPath, fileName);
        if (await fileExists(filePath)) {
            return filePath;
        }

        const parentDirPath = path.dirname(dirPath);
        if (parentDirPath == dirPath) {
            break;
        }

        dirPath = parentDirPath;
    }

    return null;
}

export interface CreateDirectoryOptions {
    recursive: boolean;
}

export interface CopyGlobItem {
    source: string;
    target: string;
}

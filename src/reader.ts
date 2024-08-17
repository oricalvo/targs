import {MissingCLIArgError, TArgsError, ValidationError} from "./errors";
import { parseNumber, parseNumberArray } from "./types/number";
import { parseBoolean } from "./types/boolean";
import { parseDate } from "./types/date";
import { parseEnum } from "./types/enum";
import { parseStringArray } from "./types/string";
import { CliArg, CliArgMetadata, CliArgMode, CliArgType } from "./models";

export class CliArgReader {
    constructor(public argv: ParsedArgv) {}

    read<T>(name: string, parser: (str: string) => T, options: { defValue?: T }): T {
        const option = (()=> {
            for (const arg of this.argv.options) {
                if (arg.name == name) {
                    return arg;
                }
            }

            return null;
        })();

        if (!option) {
            if (options.defValue !== undefined) {
                return options.defValue;
            }

            throw new MissingCLIArgError(name);
        }

        return parser(option.value);
    }

    readCmd() {
        const {cmd} = this.argv;

        if(!cmd) {
            throw new TArgsError("Missing CLI command");
        }

        return cmd;
    }

    readCmdArgv() {
        const {cmdArgv} = this.argv;

        if(!cmdArgv) {
            throw new TArgsError("Missing CLI command's argv");
        }

        return cmdArgv;
    }

    readString(name: string, options: { defValue?: string } = {}): string {
        return this.read(name, str => str, options);
    }

    readNumber(name: string, options: { defValue?: number } = {}): number {
        return this.read(name, parseNumber, options);
    }

    readBoolean(name: string, options: { defValue?: boolean } = {}): boolean {
        return this.read(name, parseBoolean, options);
    }

    readDate(name: string, options: { defValue?: Date } = {}): Date {
        return this.read(name, parseDate, options);
    }

    readEnum<T>(name: string, enumType: object, options: { defValue?: T } = {}): T {
        return this.read(name, parseEnum.bind(undefined, enumType), options);
    }

    readStringArray(name: string, options: { separator?: string; defValue?: string[] } = {}): string[] {
        return this.read(name, str => parseStringArray(str, options.separator), options);
    }

    readNumberArray(name: string, options: { separator?: string; defValue?: number[] }): number[] {
        return this.read(name, str => parseNumberArray(str, options.separator), options);
    }
}

export function readCliArgs<T>(argsMetadataT: T, argv?: string[]): T {
    const res: any = {};
    argv = argv || process.argv.slice(2);

    //
    //  Prepare metadata
    //
    const definition: { [key: string]: CliArgMetadata } = <any>argsMetadataT;
    const definitionArgs: CliArgMetadata[] = (function () {
        const argsMetadata: CliArgMetadata[] = [];

        for (const key in definition) {
            const metadata = definition[key];
            metadata.key = key;
            metadata.name = metadata.name || key;

            argsMetadata.push(metadata);
        }

        return argsMetadata;
    })();
    const definitionCmd = definitionArgs.find(a => a.type == CliArgType.Cmd);
    const definitionCmdArgv = definitionArgs.find(a => a.type == CliArgType.CmdArgv);

    const parsedArgv = parseCliArgs(argv, {
        cmd: !!definitionCmd ? CliArgMode.required : CliArgMode.notAllowed,
        argv: (() => {
            if (!definitionCmdArgv) {
                return CliArgMode.notAllowed;
            }

            if (definitionCmdArgv.required) {
                return CliArgMode.required;
            }

            return CliArgMode.allowed;
        })(),
        options: true,
    });

    const { cmd: cmdName, cmdArgv: cmdArgv, options: actualArgs } = parsedArgv;

    //
    //  Validate no unexpected arg
    //
    if (definitionCmd && !cmdName) {
        throw new ValidationError("Missing CLI command");
    }

    if (cmdName && !definitionCmd && !definitionCmdArgv) {
        throw new ValidationError("Unexpected CLI command: " + cmdName);
    }

    if (cmdArgv && cmdArgv.length && !definitionCmdArgv) {
        throw new Error("Unexpected argv: " + cmdArgv);
    }

    if (actualArgs) {
        for (const arg of actualArgs) {
            const definition = definitionArgs.find(a => a.name == arg.name);
            if (!definition) {
                throw new ValidationError("Unexpected CLI parameter: " + arg.name);
            }

            arg.metadata = definition;
        }
    }

    const reader = new CliArgReader(parsedArgv);

    if (definitionCmd) {
        res[definitionCmd.name] = definitionCmd.handler(reader, cmdName);
    }

    if (definitionCmdArgv) {
        res[definitionCmdArgv.name] = definitionCmdArgv.handler(reader, cmdArgv);
    }

    //
    //  Fill result
    //
    for (const argDef of definitionArgs) {
        if (argDef.type == CliArgType.Cmd || argDef.type == CliArgType.CmdArgv) {
            continue;
        }

        const actualArg = actualArgs.find(a => a.name == argDef.name);
        res[argDef.key] = argDef.handler(reader, actualArg?.value);
    }

    return res;
}

export function parseCliArgs(argv: string[], options: ParseCliArgsOptions): ParsedArgv {
    options = {
        cmd: CliArgMode.notAllowed,
        argv: CliArgMode.notAllowed,
        options: true,
        ...options,
    };

    const res: ParsedArgv = {
        options: options.options ? [] : undefined,
        cmdArgv: options.argv == CliArgMode.allowed ? [] : undefined,
    };

    const cmdIsAllowedOrRequired = options.cmd == CliArgMode.allowed || options.cmd == CliArgMode.required;
    const argvIsAllowedOrRequired = options.argv == CliArgMode.allowed || options.argv == CliArgMode.required;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        const isOption = arg.startsWith("--");
        if (isOption) {
            const argName = arg.substring(2);
            const argValue = (() => {
                const next = argv[i + 1];
                if (!next) {
                    return "";
                }

                if (next.startsWith("--")) {
                    return "";
                }

                ++i;

                return next;
            })();

            if (!options.options) {
                if (argvIsAllowedOrRequired) {
                    const subArgv = argv.slice(i);
                    res.cmdArgv = subArgv;
                    break;
                }

                throw new Error("Unexpected option: " + argName);
            }

            res.options.push({
                name: argName,
                value: argValue,
                metadata: null,
            });

            continue;
        }

        //
        //  Not an option --> this is a cmd
        //
        if (cmdIsAllowedOrRequired) {
            res.cmd = arg;
            res.cmdArgv = argv.slice(i + 1);
            break;
        }

        //
        //  Not an option and cmd is not allowed --> this is the beginning of an argv
        //
        if (argvIsAllowedOrRequired) {
            res.cmdArgv = argv.slice(i);
            break;
        }

        throw new Error("Unexpected cmd: " + arg);
    }

    if (options.cmd == CliArgMode.required && !res.cmd) {
        throw new ValidationError("No cmd was specified");
    }

    if (options.argv == CliArgMode.required && !res.cmdArgv) {
        throw new ValidationError("No argv was specified");
    }

    return res;
}

export interface ParseCliArgsOptions {
    //
    //  Default is notAllowed
    //
    cmd?: CliArgMode;

    //
    //  If false, options are not allowed (ror example, --show true)
    //  Default is true
    //
    options?: boolean;

    //
    //  Default is notAllowed
    //
    argv?: CliArgMode;
}

export interface ParsedArgv {
    cmd?: string;
    cmdArgv?: string[];
    options?: CliArg[];
}

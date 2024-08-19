import { readCliArgs } from "@oricalvo/targs/dist/reader.js";
import { CliArgCmd, CliArgCmdArgv } from "@oricalvo/targs/dist/types/cmd.js";

async function main() {
    const { cmd, argv } = readCliArgs({
        cmd: CliArgCmd(),
        argv: CliArgCmdArgv(),
    });

    if (cmd == "publish") {
        await publish(argv);
    } else {
        throw new Error("Unexpected command: " + cmd);
    }
}

async function publish(argv: string[]) {
    console.log("XXX");
}

main();

import { readCliArgs } from "@oricalvo/targs/dist/reader.js";
import { CliArgString } from "@oricalvo/targs/dist/types/string.js";

function main() {
    const cli = readCliArgs({
        name: CliArgString(),
    });

    console.log("Hello " + cli.name);
}

main();

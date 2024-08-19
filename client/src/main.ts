import { readCliArgs } from "@oricalvo/targs/dist/reader";
import { CliArgString } from "@oricalvo/targs/dist/types/string";

function main() {
    const cli = readCliArgs({
        name: CliArgString(),
    });

    console.log("Hello " + cli.name);
}

main();

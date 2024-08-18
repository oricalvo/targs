import { readCliArgs } from "./reader";
import { CliArgArrayString, CliArgString } from "./types/string";
import { CliArgArrayNumber, CliArgNumber } from "./types/number";
import sas from "source-map-support";
import { CliArgBoolean } from "./types/boolean";
import { CliArgDate } from "./types/date";
import { CliArgEnum } from "./types/enum";
import { CliArgCmd, CliArgCmdArgv } from "./types/cmd";

async function main() {
    sas.install();

    const cli = readCliArgs({
        cmd: CliArgCmd(),
        cmdArgv: CliArgCmdArgv(),
        name: CliArgString(),
        verbose: CliArgBoolean("v"),
        id: CliArgNumber("id"),
        color: CliArgEnum<Color>(Color, Color.blue),
        birthday: CliArgDate(),
        emails: CliArgArrayString(),
        nums: CliArgArrayNumber("nums", [1, 2]),
    });

    console.log("Name: " + cli.name);
    console.log("Verbose: " + cli.verbose);
    console.log("ID: " + cli.id);
    console.log("Color: " + cli.color);
    console.log("Birthday: " + cli.birthday);
    console.log("EMails: " + cli.emails);
    console.log("Nums: " + cli.nums);
}

enum Color {
    red = 1,
    green = 2,
    blue = 3,
}

main();

import { expect, test } from "@jest/globals";
import { CliArgBoolean, parseBoolean } from "./boolean";
import { readCliArgs } from "../reader";
import { CliArgString } from "./string";

test("parseBoolean with true/false/empty", () => {
    expect(parseBoolean("true")).toEqual(true);
    expect(parseBoolean("false")).toEqual(false);
    expect(parseBoolean("")).toEqual(true);
});

test("--verbose", () => {
    const cli = readCliArgs(
        {
            verbose: CliArgBoolean(),
        },
        ["--verbose"],
    );

    expect(cli.verbose).toEqual(true);
});

test("--verbose --name ori", () => {
    const cli = readCliArgs(
        {
            verbose: CliArgBoolean(),
            name: CliArgString("name"),
        },
        ["--verbose", "--name", "Ori"],
    );

    expect(cli.verbose).toEqual(true);
    expect(cli.name).toEqual("Ori");
});

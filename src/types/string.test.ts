import { expect, test } from "@jest/globals";
import { readCliArgs } from "../reader";
import { CliArgString } from "./string";

test("--name Ori", () => {
    const cli = readCliArgs(
        {
            name: CliArgString(),
        },
        ["--name", "Ori"],
    );

    expect(cli.name).toStrictEqual("Ori");
});

test("CliArgString with default", () => {
    const cli = readCliArgs(
        {
            name: CliArgString("name", "Roni"),
        },
        [],
    );

    expect(cli.name).toStrictEqual("Roni");
});

import { expect, test } from "@jest/globals";
import { readCliArgs } from "../reader.js";
import { CliArgDate, parseISODate } from "./date.js";

test("parseISODate with ISO format", () => {
    expect(parseISODate("2024-01-01")).toEqual(new Date(Date.UTC(2024, 0, 1)));
});

test("parseISODate throws when using non ISO format", () => {
    expect(() => parseISODate("2024")).toThrow();
});

test("--birthday 2024-01-01", () => {
    const cli = readCliArgs(
        {
            birthday: CliArgDate(),
        },
        ["--birthday", "2024-01-01"],
    );

    expect(cli.birthday).toEqual(parseISODate("2024-01-01"));
});

test("CliArgDate with default value", () => {
    const d = parseISODate("2024-01-01");

    const cli = readCliArgs(
        {
            birthday: CliArgDate("birthday", d),
        },
        [],
    );

    expect(cli.birthday).toEqual(d);
});

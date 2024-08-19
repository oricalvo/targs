import { expect, test } from "@jest/globals";
import { readCliArgs } from "../reader.js";
import { CliArgEnum, parseEnum } from "./enum.js";

test("parseEnum with string based enum", () => {
    enum Color {
        red = "redXXX",
        green = "greenXXX",
        blue = "blueXXX",
    }

    expect(parseEnum(Color, "red")).toEqual(Color.red);
});

test("parseEnum with number based enum", () => {
    enum Color {
        red = 1,
        green = 2,
        blue = 3,
    }

    expect(parseEnum(Color, "red")).toEqual(Color.red);
});

test("--color red", () => {
    enum Color {
        red = "red",
        green = "green",
        blue = "blue",
    }

    const cli = readCliArgs(
        {
            color: CliArgEnum(Color),
        },
        ["--color", "red"],
    );

    expect(cli.color).toEqual(Color.red);
});

test("CliArgEnum with default", () => {
    enum Color {
        red = "red",
        green = "green",
        blue = "blue",
    }

    const cli = readCliArgs(
        {
            color: CliArgEnum(Color, Color.green),
        },
        [],
    );

    expect(cli.color).toEqual(Color.green);
});

import { expect, test } from "@jest/globals";
import { readCliArgs } from "../reader.js";
import { CliArgArrayNumber, parseNumber, parseNumberArray } from "./number.js";

test("parseNumber with simple number", () => {
    expect(parseNumber("123")).toEqual(123);
});

test("parseNumber throws", () => {
    expect(() => parseNumber("123xx")).toThrow();
});

test("parseNumberArray with 1,2,3", () => {
    expect(parseNumberArray("1,2,3")).toStrictEqual([1, 2, 3]);
});

test("parseNumberArray throws on xxx", () => {
    expect(() => parseNumberArray("xxx")).toThrow();
});

test("parseNumberArray throws 1,a,2", () => {
    expect(() => parseNumberArray("1,a,2")).toThrow();
});

test("parseNumberArray with non default separator", () => {
    expect(parseNumberArray("1 0 2", " ")).toStrictEqual([1, 0, 2]);
});

test("--nums 1,2,3", () => {
    const cli = readCliArgs(
        {
            nums: CliArgArrayNumber(),
        },
        ["--nums", "1,2,3"],
    );

    expect(cli.nums).toStrictEqual([1, 2, 3]);
});

test("CliArgArrayNumber with default", () => {
    const cli = readCliArgs(
        {
            nums: CliArgArrayNumber("nums", [1, 2, 3]),
        },
        [],
    );

    expect(cli.nums).toStrictEqual([1, 2, 3]);
});

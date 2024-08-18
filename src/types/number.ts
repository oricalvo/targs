import { CliArgReader } from "../reader";
import { parseStringArray } from "./string";
import { CliArgMetadata, CliArgType } from "../models";

export function CliArgNumber(): number;
export function CliArgNumber(name: string): number;
export function CliArgNumber(name: string, defValue: number): number;
export function CliArgNumber(name?: string, defValue?: number): number {
    const metadata: CliArgMetadata = {
        type: CliArgType.Number,
        handler: function (reader: CliArgReader, value: string) {
            return reader.readNumber(this.name, { defValue });
        },
        name,
        key: undefined,
    };

    return <any>metadata;
}

export function CliArgArrayNumber(): number[];
export function CliArgArrayNumber(name: string): number[];
export function CliArgArrayNumber(name: string, defValue: number[]): number[];
export function CliArgArrayNumber(name?: string, defValue?: number[]): number[] {
    const hasDefValue = arguments.length == 2;

    const metadata: CliArgMetadata = {
        type: CliArgType.NumberArray,
        handler: function (reader: CliArgReader): any {
            if (hasDefValue) {
                return reader.readNumberArray(this.name, { defValue });
            }

            return reader.readNumberArray(this.name, {});
        },
        name,
        key: undefined,
    };

    return <any>metadata;
}

export function parseNumber(str: string): number {
    const num = +str;

    if (isNaN(num)) {
        throw new Error("Invalid number string: " + str);
    }

    return num;
}

export function parseInteger(str: string): number {
    const num = parseInt(str, 10);

    if (isNaN(num)) {
        throw new Error("Invalid integer string: " + str);
    }

    return num;
}

export function parseNumberArray(str: string, separator?: string): number[] {
    const arr = parseStringArray(str, separator);

    return arr.map(n => parseNumber(n));
}

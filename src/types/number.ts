import {CliArgReader} from "../reader";
import {parseStringArray} from "./string";
import {CliArgMetadata, CliArgType} from "../models";

export function CliArgNumber(): number;
export function CliArgNumber(name: string): number;
export function CliArgNumber(name: string, defValue: number): number;
export function CliArgNumber(name?: string, defValue?: number): number {
    const args = Array.from(arguments);

    const metadata: CliArgMetadata = {
        type: CliArgType.Number,
        handler: (reader: CliArgReader, key: string): number => {
            args[0] = name || key;
            return reader.readNumber.apply(reader, args);
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

    if(isNaN(num)) {
        throw new Error("Invalid number string: " + str);
    }

    return num;
}

export function parseNumberArray(str: string, separator?: string): number[] {
    const arr = parseStringArray(str, separator);

    return arr.map(n => parseNumber(n));
}

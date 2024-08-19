import { CliArgReader } from "../reader.js";
import { CliArgMetadata, CliArgType } from "../models.js";

export function CliArgString(): string;
export function CliArgString(name: string): string;
export function CliArgString(name: string, defValue: string): string;
export function CliArgString(name?: string, defValue?: string): string {
    const metadata: CliArgMetadata = {
        type: CliArgType.String,
        handler: function (reader: CliArgReader) {
            return reader.readString(this.name, { defValue });
        },
        name: <any>name,
        key: <any>undefined,
    };

    return <any>metadata;
}

export function CliArgArrayString(): string[];
export function CliArgArrayString(name: string): string[];
export function CliArgArrayString(name: string, defValue: string[]): string[];
export function CliArgArrayString(name: string, defValue: string[], separator: string): string[];
export function CliArgArrayString(name?: string, defValue?: string[], separator: string = " "): string[] {
    const hasDefValue = arguments.length > 1;

    const metadata: CliArgMetadata = {
        type: CliArgType.StringArray,
        handler: function (reader: CliArgReader): any {
            const options = <any>{
                separator,
            };

            if (hasDefValue) {
                options.defValue = defValue;
            }

            return reader.readStringArray(this.name, options);
        },
        name: <any>name,
        key: <any>undefined,
    };

    return <any>metadata;
}

export function parseStringArray(str: string, separator?: string): string[] {
    separator = separator || ",";

    return str.split(separator).map(s => s.trim());
}

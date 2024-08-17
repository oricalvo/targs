import {CliArgReader} from "../reader";
import {CliArgMetadata, CliArgType} from "../models";

export function CliArgDate(): Date;
export function CliArgDate(name: string): Date;
export function CliArgDate(name: string, defValue: Date): Date;
export function CliArgDate(name?: string, defValue?: Date): Date {
    const metadata: CliArgMetadata = {
        type: CliArgType.Date,
        handler: function (reader: CliArgReader) {
            return reader.readDate(this.name);
        },
        name,
        key: undefined,
    };

    return <any>metadata;
}

export function parseDate(str: string, ignoreZMark: boolean = false): Date {
    if (!str) {
        return null;
    }

    if (ignoreZMark) {
        if (str.endsWith("Z")) {
            str = str.substring(0, str.length - 1);
        }
    }

    const d = new Date(str);

    if (isNaN(d.getTime())) {
        throw new Error("Failed to parse date string " + str);
    }

    return d;
}

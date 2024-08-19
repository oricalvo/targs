import { CliArgReader } from "../reader";
import { CliArgMetadata, CliArgType } from "../models";
import { DateTime } from "luxon";

export function CliArgDate(): Date;
export function CliArgDate(name: string): Date;
export function CliArgDate(name: string, defValue: Date): Date;
export function CliArgDate(name?: string, defValue?: Date): Date {
    const metadata: CliArgMetadata = {
        type: CliArgType.Date,
        handler: function (reader: CliArgReader) {
            return reader.readDate(this.name, { defValue });
        },
        name,
        key: undefined,
    };

    return <any>metadata;
}

export function parseISODate(str: string): Date {
    if (!str) {
        return null;
    }

    const d = DateTime.fromFormat(str, "yyyy-MM-dd", { zone: "UTC" });

    if (!d.isValid) {
        throw new Error("Invalid date string: " + str);
    }

    return d.toJSDate();
}

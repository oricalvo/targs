import { DateTime } from "luxon";
import { CliArgReader } from "../reader.js";
import { CliArgMetadata, CliArgType } from "../models.js";

export function CliArgDate(): Date;
export function CliArgDate(name: string): Date;
export function CliArgDate(name: string, defValue: Date): Date;
export function CliArgDate(name?: string, defValue?: Date): Date {
    const metadata: CliArgMetadata = {
        type: CliArgType.Date,
        handler: function (reader: CliArgReader) {
            return reader.readDate(this.name, { defValue });
        },
        name: <string>name,
        key: <any>undefined,
    };

    return <any>metadata;
}

export function parseISODate(str: string): Date {
    const d = DateTime.fromFormat(str, "yyyy-MM-dd", { zone: "UTC" });

    if (!d.isValid) {
        throw new Error("Invalid date string: " + str);
    }

    return d.toJSDate();
}

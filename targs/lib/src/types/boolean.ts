import { CliArgReader } from "../reader.js";
import { ValidationError } from "../errors.js";
import { CliArgMetadata, CliArgType } from "../models.js";

export function CliArgBoolean(): boolean;
export function CliArgBoolean(name: string): boolean;
export function CliArgBoolean(defValue: boolean): boolean;
export function CliArgBoolean(name: string, defValue: boolean): boolean;
export function CliArgBoolean(arg1?: string | boolean, arg2?: boolean): boolean {
    const args = Array.from(arguments);

    const { name, hasDefValue, defValue } = (function () {
        if (args.length == 1) {
            if (typeof arg1 == "string") {
                return {
                    name: arg1,
                    hasDefValue: false,
                    defValue: undefined,
                };
            } else {
                return {
                    name: undefined,
                    hasDefValue: true,
                    defValue: <boolean>arg1,
                };
            }
        } else {
            return {
                name: <string>arg1,
                hasDefValue: true,
                defValue: <boolean>arg2,
            };
        }
    })();

    const metadata: CliArgMetadata = {
        type: CliArgType.Boolean,
        handler: function (reader: CliArgReader, value: string): boolean {
            if (value === undefined) {
                if (!hasDefValue) {
                    throw new ValidationError("Parameter " + this.name + " is missing");
                }

                return !defValue;
            }

            return reader.readBoolean(this.name, { defValue });
        },
        name: <any>name,
        key: <any>undefined,
    };

    return <any>metadata;
}

export function parseBoolean(str: string): boolean {
    if (str === "") {
        return true;
    }

    if (str === "false") {
        return false;
    }

    if (str === "true") {
        return true;
    }

    throw new Error("Invalid boolean string: " + str);
}

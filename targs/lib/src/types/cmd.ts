import { CliArgMetadata, CliArgType } from "../models.js";
import { CliArgReader } from "../reader.js";

export function CliArgCmd(): string {
    const metadata: CliArgMetadata = {
        type: CliArgType.Cmd,
        name: <any>undefined,
        key: <any>undefined,
        handler: (reader: CliArgReader, value: any): string => {
            return value;
        },
    };

    return <any>metadata;
}

export function CliArgCmdArgv(required: boolean = false): string[] {
    const metadata: CliArgMetadata = {
        type: CliArgType.CmdArgv,
        name: <any>undefined,
        key: <any>undefined,
        handler: (reader: CliArgReader, value: any): string => {
            return value;
        },
        required,
    };

    return <any>metadata;
}

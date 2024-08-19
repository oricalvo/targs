import { CliArgMetadata, CliArgType } from "../models";
import { CliArgReader } from "../reader";

export function CliArgCmd(): string {
    const metadata: CliArgMetadata = {
        type: CliArgType.Cmd,
        name: undefined,
        key: undefined,
        handler: (reader: CliArgReader, value: any): string => {
            return value;
        },
    };

    return <any>metadata;
}

export function CliArgCmdArgv(required: boolean = false): string[] {
    const metadata: CliArgMetadata = {
        type: CliArgType.CmdArgv,
        name: undefined,
        key: undefined,
        handler: (reader: CliArgReader, value: any): string => {
            return value;
        },
        required,
    };

    return <any>metadata;
}

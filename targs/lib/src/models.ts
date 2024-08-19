import { CliArgReader } from "./reader.js";

export enum CliArgType {
    Number = 1,
    String = 2,
    Boolean = 3,
    Date = 4,
    Enum = 5,
    StringArray = 6,
    NumberArray = 7,
    Cmd = 8,
    CmdArgv = 9,
}

export interface CliArgMetadata {
    type: CliArgType;

    handler: (reader: CliArgReader, value: any) => any;

    //
    //  Option name. For example, --name
    //
    name: string;

    //
    //  The field name (not option name). For example,
    //  readCliArgs({verbose: CliArgBoolean("v")}) ==> name is v, key is verbose
    //  When name is not specified by the caller, the key is used as name
    //
    key: string;

    //
    //  Is only used in the case of CliArgType.argv
    //  If true, user must specify argv
    //  Default is false
    //
    required?: boolean;
}

export enum CliArgMode {
    notAllowed = "notAllowed",
    allowed = "allowed",
    required = "required",
}

export interface CliArg {
    name: string;
    value: string;
    metadata: CliArgMetadata;
}

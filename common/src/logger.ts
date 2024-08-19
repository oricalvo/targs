import { repeat } from "./array.helpers.js";
import _ from "lodash";
import { DateTime } from "luxon";

const IDENT_SIZE = 4;

export class ModuleLogger implements ILogger {
    private _moduleName: string|undefined;
    private _parent: ILogger;

    constructor(moduleName?: string, parent?: ILogger) {
        this._parent = parent || globalLogger;
        this._moduleName = moduleName;
    }

    error(message: string, error?: Error): void {
        this._parent.error(this.prependModuleName(message), error);
    }

    warn(message: string, ...meta: any[]): void {
        this._parent.warn(this.prependModuleName(message), ...meta);
    }

    info(message: string, ...meta: any[]): void {
        this._parent.info(this.prependModuleName(message), ...meta);
    }

    debug(message: string, ...meta: any[]): void {
        this._parent.debug(this.prependModuleName(message), ...meta);
    }

    errorJson: LogJsonMethod = <any>logJson.bind(undefined, this, "error");
    warnJson: LogJsonMethod = <any>logJson.bind(undefined, this, "warn");
    infoJson: LogJsonMethod = <any>logJson.bind(undefined, this, "info");
    debugJson: LogJsonMethod = <any>logJson.bind(undefined, this, "debug");

    infoConfig: LogJsonMethod = <any>logConfig.bind(undefined, this, "info");
    debugConfig: LogJsonMethod = <any>logConfig.bind(undefined, this, "debug");

    errorJsonLine: LogJsonMethod = <any>logJsonLine.bind(undefined, this, "error");
    warnJsonLine: LogJsonMethod = <any>logJsonLine.bind(undefined, this, "warn");
    infoJsonLine: LogJsonMethod = <any>logJsonLine.bind(undefined, this, "info");
    debugJsonLine: LogJsonMethod = <any>logJsonLine.bind(undefined, this, "debug");

    private prependModuleName(message: string): string {
        if (this._moduleName) {
            return `[${this._moduleName}] ` + message;
        }

        return message;
    }
}

export interface LogJsonMethod {
    (obj: any): void;
    (message: string, obj: any): void;
}

export function logLine(logger: ILogger, level: keyof ILogger, message: string, ident?: number) {
    const prefix = ident ? repeat(" ", (ident || 0) * IDENT_SIZE).join("") : "";

    logger[level](prefix + message);
}

export interface LogJson {
    (logger: ILogger, level: keyof ILogger, obj: any): void;
    (logger: ILogger, level: keyof ILogger, message: string, obj: any): void;
}

function _logJson(logger: ILogger, level: keyof ILogger, arg1: string, arg2: any, pretty: boolean) {
    const obj = arg2 == undefined ? arg1 : arg2;
    const message = arg2 == undefined ? undefined : arg1;
    const json = (message ? message + " " : "") + (pretty ? JSON.stringify(obj, undefined, 2) : JSON.stringify(obj));

    logger[level](json);
}

const SENSITIVE_FIELDS = ["password", "secret"];

function _logConfig(logger: ILogger, level: keyof ILogger, arg1: string, arg2: any, pretty: boolean) {
    //
    //  Clone obj and remove sensitive keys
    //
    const obj = _.cloneDeep(arg2 == undefined ? arg1 : arg2);
    for (const key in obj) {
        for (const sensitive of SENSITIVE_FIELDS) {
            if (key.toLowerCase().includes(sensitive)) {
                delete obj[key];
                break;
            }
        }
    }

    const message = arg2 == undefined ? undefined : arg1;
    const json = (message ? message + " " : "") + (pretty ? JSON.stringify(obj, undefined, 2) : JSON.stringify(obj));

    logger[level](json);
}

export const logJson: LogJson = (logger: ILogger, level: keyof ILogger, arg1: any, arg2?: any) => {
    _logJson(logger, level, arg1, arg2, true);
};

export const logJsonLine: LogJson = (logger: ILogger, level: keyof ILogger, arg1: any, arg2?: any) => {
    _logJson(logger, level, arg1, arg2, false);
};

//
//  Log obj as json but removed sensitive fields such as password and secret
//
export const logConfig: LogJson = (logger: ILogger, level: keyof ILogger, arg1: any, arg2?: any) => {
    _logConfig(logger, level, arg1, arg2, true);
};

export function createLogger(moduleName?: string, logger?: ILogger): ModuleLogger {
    return new ModuleLogger(moduleName, logger);
}

export enum LogLevel {
    none = "none",
    error = "error",
    warn = "warn",
    info = "info",
    debug = "debug",
}

export enum LogLevelNumeric {
    none = 0,
    error = 1,
    warn = 2,
    info = 3,
    debug = 4,
}

export interface ILogger {
    error(message: any, error?: Error): void;
    warn(message: any, ...meta: any[]): void;
    info(message: any, ...meta: any[]): void;
    debug(message: any, ...meta: any[]): void;
}

export class NullLogger implements ILogger {
    error(message: any, error: Error): void {}
    warn(message: any, ...meta: any[]): void {}
    info(message: any, ...meta: any[]): void {}
    debug(message: any, ...meta: any[]): void {}
}

export class GlobalLogger implements ILogger {
    public instance: ILogger = new ConsoleLogger();

    error(message: any, error: Error) {
        this.instance?.error(message, error);
    }

    warn(message: any, ...meta: any[]) {
        this.instance?.warn(message, ...meta);
    }

    info(message: any, ...meta: any[]) {
        this.instance?.info(message, ...meta);
    }

    debug(message: any, ...meta: any[]) {
        this.instance?.debug(message, ...meta);
    }
}

export class ConsoleLogger implements ILogger {
    private logLevel: LogLevelNumeric = LogLevelNumeric.info;
    private readonly PAD = 7;

    constructor() {
        //
        //  Under common project we cannot reference directly NodeJS assets so
        //  we need to work with the global NodeJS reference
        //
        if (typeof global !== "undefined") {
            const logLevel: LogLevel = global.process.env["OC_LOGLEVEL"] || LogLevel.info;
            this.logLevel = LogLevelNumeric[logLevel] || LogLevelNumeric.info;
        }
    }

    error(message: string, error: Error) {
        this.inner(LogLevelNumeric.error, message, [error]);
    }

    warn(message: any, ...meta: any[]) {
        this.inner(LogLevelNumeric.warn, message, meta);
    }

    info(message: any, ...meta: any[]) {
        this.inner(LogLevelNumeric.info, message, meta);
    }

    debug(message: any, ...meta: any[]) {
        this.inner(LogLevelNumeric.debug, message, meta);
    }

    private inner(logLevel: LogLevelNumeric, message: any, meta: any[]) {
        if (this.logLevel < logLevel) {
            return;
        }

        const funcName = LogLevelNumeric[logLevel];
        const logLevelStr = `[${funcName.toUpperCase()}]`.padEnd(this.PAD);
        const timestamp = DateTime.now().toFormat("HH:mm:ss.SSS");

        console.log(timestamp, logLevelStr, message, ...meta);
    }
}

export const globalLogger = new GlobalLogger();

declare var global: any;

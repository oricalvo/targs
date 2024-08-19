export enum ErrorCode {
    unexpected = 1,
    validation = 2,
}

export class TArgsError extends Error {
    constructor(
        public readonly message: string,
        public readonly errorCode: ErrorCode = ErrorCode.unexpected,
    ) {
        super(message);
    }
}

export class ValidationError extends TArgsError {
    constructor(message: string) {
        super(message, ErrorCode.validation);
    }
}

export class MissingCLIArgError extends ValidationError {
    constructor(name: string) {
        super('A required command line argument "' + name + '" was not specified');
    }
}

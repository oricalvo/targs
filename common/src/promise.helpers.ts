import PAll from "p-all";
import PMap from "p-map";

export type Task<T> = () => Promise<T>;

export interface Deferred<T> {
    promise: Promise<T>;
    resolve: (val: T) => void;
    reject: (err: Error) => void;
}

export function defer<T>(): Deferred<T> {
    const res: Deferred<T> = <any>{};

    res.promise = new Promise<T>((resolve, reject) => {
        res.resolve = resolve;
        res.reject = reject;
    });

    return res;
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function wasFulfilled<T>(promise: Promise<T>): Promise<boolean> {
    let fulfilled = false;

    await promise
        .then(function () {
            fulfilled = true;
        })
        .catch(function () {
            //
            //  Swallow error
            //
        });

    return fulfilled;
}

export async function wasRejected<T>(promise: Promise<T>): Promise<boolean> {
    let rejected = false;

    await promise.catch(function () {
        rejected = true;
    });

    return rejected;
}

export async function waitFor<T>(
    pred: () => Promise<T>,
    intervalMS: number,
    timeoutMS: number,
    operationId: string,
    checkNotExist: boolean = false
): Promise<T|null> {
    const begin = new Date();

    while (true) {
        const retVal = await pred();
        if (retVal) {
            if (checkNotExist) {
                throw new Error("Unexpected entity was created as part of operation: " + operationId);
            }

            return retVal;
        }

        const now = new Date();
        if (now.valueOf() - begin.valueOf() > timeoutMS) {
            if (checkNotExist) {
                //
                //  This is actually OK
                //
                return null;
            } else {
                throw new Error("Timeout while waiting for " + operationId);
            }
        }

        await delay(intervalMS);
    }
}

export type EventListener = (args: any[]) => void;

//
//  Do not use NodeJS EventEmitter since it is writable and since we do not want NodeJS depenedency in common
//
export interface EventEmitterSource {
    removeListener(eventName: string, listener: EventListener): void;
    once(eventName: string, listener: EventListener): void;
}

export function waitForEvent<T>(
    source: EventEmitterSource,
    eventName: string,
    rejectOnErrorEvent: boolean = true
): Promise<T> {
    if (!source) {
        return Promise.resolve(<T>null);
    }

    return new Promise((resolve, reject) => {
        function onSuccess(res: any) {
            cleanup();
            resolve(res);
        }

        function onError(err: any) {
            cleanup();
            reject(err);
        }

        function cleanup() {
            source.removeListener(eventName, onSuccess);
            if (rejectOnErrorEvent) {
                source.removeListener("error", onError);
            }
        }

        source.once(eventName, onSuccess);

        if (rejectOnErrorEvent) {
            source.once("error", onError);
        }
    });
}

export const pMap: typeof PMap = <any>((a: any, b: any, c: any) => {
    return PMap(a, b, c);
});

export const pAll: typeof PAll = <any>((a: any, b: any) => {
    return PAll(a, b);
});

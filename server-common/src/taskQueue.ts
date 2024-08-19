import { defer, Deferred, Task } from "@oricalvo/common/dist/promise.helpers.js";
import { createLogger } from "@oricalvo/common/dist/logger.js";
import os from "os";

const logger = createLogger("TaskQueue");

export class TaskQueue<T> {
    //
    //  Tasks that were started but was not finished yet
    //
    private running: Promise<T>[] = [];

    //
    //  Tasks that were not started and are waiting for other tasks to complete
    //  We currently do not allow multiple waiting run
    //  Therefore there will be only one pending at most
    //
    private pending: { task: Task<T>; taskId: number }[] = [];

    //
    //  The promise the caller is waiting on when calling run and running queue is full
    //
    private deferredRun: Deferred<T>|null = null;

    //
    //  The promise the caller is waiting on when calling waitForCompletion
    //
    private deferredWaitForCompletion: Deferred<void>|null = null;
    private waitForCompletionNoThrow: boolean|undefined;

    private error: Error|null = null;
    private disposed: boolean = false;
    private nextTaskId: number = 1;

    constructor(public parallelism: number) {}

    dispose() {
        this.disposed = true;
        this.running = [];
        this.deferredRun = null;
        this.deferredWaitForCompletion = null;
        this.pending = [];
    }

    async run(task: Task<T>, onError?: (err: Error) => void): Promise<void> {
        const taskId = this.nextTaskId++;

        if (this.disposed) {
            throw new Error("Already disposed");
        }

        if (this.deferredWaitForCompletion) {
            throw new Error("You should not call run after waitForCompletion was requested");
        }

        if (this.deferredRun) {
            throw new Error("You should not call run while previous run is not completed yet");
        }

        if (this.error) {
            //
            //  Cannot serve new requests after error was encountered
            //
            throw this.error;
        }

        if (this.running.length < this.parallelism) {
            //
            //  runTask without await
            //  This means run returns immediately and caller is able to call run with another task
            //
            this.runTask(task, taskId, onError);
        } else {
            //
            //  Block caller until one running task completes
            //
            await this.enqueueTask(task, taskId);
        }
    }

    //
    //  Waits until running queue is empty
    //  It is the caller responsibility to not queue new tasks while calling this function
    //
    async waitForCompletion(noThrow: boolean = false): Promise<void> {
        if (this.disposed) {
            throw new Error("Already disposed");
        }

        if (this.deferredWaitForCompletion) {
            throw new Error("waitForCompletion was already requested");
        }

        if (!this.running.length) {
            return Promise.resolve();
        }

        this.deferredWaitForCompletion = defer<void>();
        this.waitForCompletionNoThrow = noThrow;

        return this.deferredWaitForCompletion.promise;
    }

    private async runTask(task: Task<T>, taskId: number, onError?: (err: Error) => void) {
        if (this.running.length >= this.parallelism) {
            throw new Error("Cannot runTask since running.length is " + this.running.length);
        }

        const promise = task();

        this.running.push(promise);
        this.monitor(promise, taskId, onError);

        this.print();
    }

    private async enqueueTask(task: Task<T>, taskId: number) {
        //
        //  Caller is expected to await on the promise and wait for one of the previous runs to complete
        //
        this.pending.push({ task, taskId });
        this.deferredRun = defer<T>();
        await this.deferredRun.promise;
    }

    private removeFromRunning(promise: Promise<T>) {
        const index = this.running.indexOf(promise);
        if (index == -1) {
            throw new Error("Monitored task was not found inside the running array");
        }
        this.running.splice(index, 1);

        this.print();
    }

    private async monitor(promise: Promise<T>, taskId: number, onError?: (err: Error) => void) {
        try {
            const retVal = await promise;

            this.removeFromRunning(promise);

            if (this.disposed) {
                //
                //  Queue was disposed
                //  Do not execute more tasks
                //
                return;
            }

            const pending = this.pending.shift();
            if (pending) {
                //
                //  Run next task (without awaiting)
                //
                this.runTask(pending.task, pending.taskId);
                return;
            }

            //
            //  No pending task. Release awaiting caller and let it send another task
            //
            if (this.deferredRun) {
                this.deferredRun.resolve(retVal);
                this.deferredRun = null;
            }
        } catch (err: any) {
            //
            //  task should never throw exception
            //  The client should catch any exception and swallow it
            //  If task throws this queue stops serving new request
            //
            this.error = err;

            this.removeFromRunning(promise);

            if (this.deferredRun) {
                this.deferredRun.reject(err);
                this.deferredRun = null;
            }

            if (onError) {
                onError(err);
            }
        } finally {
            if (!this.running.length) {
                //
                //  Inform callers waiting on waitForCompletion
                //
                if (this.deferredWaitForCompletion) {
                    if (this.error && !this.waitForCompletionNoThrow) {
                        this.deferredWaitForCompletion.reject(this.error);
                    } else {
                        this.deferredWaitForCompletion.resolve(<any>{});
                    }
                }
            }
        }
    }

    static create(parallelism?: number) {
        parallelism = parallelism || Math.ceil(os.cpus().length * 1.25);

        return new TaskQueue(parallelism);
    }

    static async runParallel<E, T>(arr: E[], taskFactory: (item: E, index: number) => Task<T>, parallelism?: number) {
        const queue = TaskQueue.create(parallelism);
        let error = null;

        try {
            for (let i = 0; i < arr.length; i++) {
                const item = arr[i];
                const task = taskFactory(item, i);

                await queue.run(task);
            }
        } catch (err) {
            error = err;

            throw err;
        } finally {
            //
            //  Always wait for all running tasks to complete
            //  However, if already encountered an error no need to rethrow it again
            //
            await queue.waitForCompletion(!!error);
        }
    }

    private print() {
        // logger.debug("running: " + this.running.length + ", pending: " + this.pending.length);
    }

    get size() {
        return this.running.length + this.pending.length;
    }
}

export class NullQueue<T> {
    private error: Error|null = null;

    async run(task: Task<T>, onError?: (err: Error) => void): Promise<void> {
        if (this.error) {
            throw this.error;
        }

        this.runTask(task, onError);
    }

    private async runTask(task: Task<T>, onError?: (err: Error) => void) {
        try {
            await task();
        } catch (err: any) {
            logger.warn("Task failed with error", err);

            this.error = err;

            if (onError) {
                onError(err);
            }
        }
    }
}

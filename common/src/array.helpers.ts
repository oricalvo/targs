import { reduceWhitespaces } from "./string.helpers.js";

export function subtract<T>(all: T[], list: T[]): T[] {
    const listSet = new Set<T>(list);
    const diff: T[] = [];

    for (const val of all) {
        if (!listSet.has(val)) {
            diff.push(val);
        }
    }

    return diff;
}

export function diff<T>(arr1: T[], arr2: T[]): T[] {
    const set1 = new Set<T>(arr1);
    const set2 = new Set<T>(arr2);

    const diff: T[] = [];

    for (const val of arr1) {
        if (!set2.has(val)) {
            diff.push(val);
        }
    }

    for (const val of arr2) {
        if (!set1.has(val)) {
            diff.push(val);
        }
    }

    return diff;
}

export function removeDiff<T, K>(arr1: T[], arr2: T[], getter: (item: T) => K): T[] {
    const set1 = new Set<K>(arr1.map(i => getter(i)));
    const set2 = new Set<K>(arr2.map(i => getter(i)));

    const diff: T[] = [];

    for (let i = 0; i < arr1.length; i++) {
        const item = arr1[i];
        const key = getter(item);

        if (!set2.has(key)) {
            diff.push(item);
            arr1.splice(i, 1);
            --i;
        }
    }

    for (let i = 0; i < arr2.length; i++) {
        const item = arr2[i];
        const key = getter(item);

        if (!set1.has(key)) {
            diff.push(item);
            arr2.splice(i, 1);
            --i;
        }
    }

    return diff;
}

export function getBy<T>(arr: T[], pred: (t: T) => boolean): T {
    for (const x of arr) {
        if (pred(x)) {
            return x;
        }
    }

    throw new Error("Required array element was not found: " + reduceWhitespaces(pred.toString()));
}

export function equals<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length != arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        const val1 = arr1[i];
        const val2 = arr2[i];

        if (val1 != val2) {
            return false;
        }
    }

    return true;
}

export function repeat<T>(item: T, len: number): T[] {
    const res: T[] = [];

    for (let i = 0; i < len; i++) {
        res.push(item);
    }

    return res;
}

export function removeOne<T>(arr: T[], val: T): boolean {
    const index = arr.indexOf(val);
    if (index == -1) {
        return false;
    }

    arr.splice(index, 1);

    return true;
}

export function removeAll<T>(arr: T[], val: T): boolean {
    let deleted = false;
    let i = 0;

    while (i < arr.length) {
        const curr = arr[i];

        if (curr == val) {
            arr.splice(i, 1);
            deleted = true;
            continue;
        }

        i++;
    }

    return deleted;
}

export function pushMany<T>(target: T[], source: T[]) {
    for (const val of source) {
        target.push(val);
    }
}

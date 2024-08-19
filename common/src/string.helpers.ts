export function parseInteger(str: string): number {
    const num = +str;
    if (isNaN(num)) {
        throw new Error("Failed to convert string " + str + " to number");
    }

    const whole = Math.floor(num);
    if (whole != num) {
        throw new Error("Unexpected integer string " + str);
    }

    return whole;
}

export function parseEnum<T, K extends keyof T>(enumType: T, str: string): T[K] {
    const val = enumType[<K>str];
    if (val === undefined) {
        throw new Error("Invalid enum string " + str);
    }

    return val;
}

export function tryParseEnum<T, K extends keyof T>(enumType: T, str: string): T[K] | null {
    const val = enumType[<K>str];
    if (val === undefined) {
        return null;
    }

    return val;
}

export function reduceWhitespaces(str: string): string {
    if (!str) {
        return str;
    }

    str = str.replace(/\s+/g, " ").trim();
    return str;
}

export function escapeRegExp(str: string) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

export function replaceAll(str: string, find: string, replace: string): string {
    return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

export function endsWithNewLine(str: string): boolean {
    const last = str.charCodeAt(str.length - 1);
    if (last == 10) {
        return true;
    }

    return false;
}

export function addStringToCommaSeparatedString(commaSeperatedString: string, item: string) {
    const items: Array<string> = commaSeperatedString ? commaSeperatedString.split(",") : [];
    items.push(item);
    return items.join(",");
}

export function getHashCode(str: string): number {
    if (!str.length) {
        return 0;
    }

    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
}

export function trimSlashSuffix(str: string) {
    if (str.endsWith("/")) {
        return str.slice(0, -1);
    }

    return str;
}

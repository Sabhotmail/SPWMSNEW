export function serializeForJSON<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    // Handle Dates
    if (obj instanceof Date) return obj.toISOString() as any;

    // Handle Decimal/BigInt
    if (typeof obj === 'object') {
        // Prisma Decimal check
        if ((obj as any).constructor?.name === 'Decimal' || ((obj as any).d && (obj as any).s !== undefined && (obj as any).e !== undefined)) {
            return Number(obj) as any;
        }
    }

    if (typeof obj === 'bigint') {
        return Number(obj) as any;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => serializeForJSON(item)) as any;
    }

    if (typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = serializeForJSON(value);
        }
        return result;
    }

    return obj;
}

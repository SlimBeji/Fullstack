import { FieldFilter, FindQueryFilters } from "../types";
import { PrismaFieldFilter } from "./types";

export const toOrderBy = <T extends string, K>(
    fields: T[],
    default_: K[]
): K[] => {
    if (!fields || fields.length === 0) {
        return default_;
    }
    return fields.map((f: string) => {
        const order = f.startsWith("-") ? "desc" : "asc";
        const field = order === "desc" ? f.substring(1) : f;
        return { [field]: order } as K;
    });
};

export const toSelect = <T, K>(fields: T[], default_: K): K => {
    if (!fields || fields.length === 0) {
        return default_;
    }
    const result = {} as Record<keyof K, true>;
    fields.forEach((f) => {
        result[f as keyof K] = true;
    });
    return result as K;
};

const toPrismaFilter = (d: FieldFilter): PrismaFieldFilter => {
    const result = {} as PrismaFieldFilter;
    Object.keys(d).forEach((k) => {
        switch (k) {
            case "eq":
                result.equals = d[k];
                break;
            case "ne":
                result.not = d[k];
                break;
            case "in":
                result.in = d[k];
                break;
            case "nin":
                result.notIn = d[k];
                break;
            case "lt":
                result.lt = d[k];
                break;
            case "lte":
                result.lte = d[k];
                break;
            case "gt":
                result.gt = d[k];
                break;
            case "gte":
                result.gte = d[k];
                break;
            case "like":
                result.contains = d[k];
                break;
            case "start":
                result.startsWith = d[k];
                break;
            case "end":
                result.endsWith = d[k];
                break;
            case "mode":
                result.mode = d[k];
                break;
            default:
                throw new Error(`unknown field filter operator ${k}`);
        }
    });
    return result;
};

export const toWhere = <S extends string, T>(f: FindQueryFilters<S>): T => {
    const result = {} as Record<S, PrismaFieldFilter>;
    (Object.keys(f) as S[]).forEach((k) => {
        result[k] = toPrismaFilter(f[k] as FieldFilter);
    });
    return result as T;
};

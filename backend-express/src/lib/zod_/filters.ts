import { RefinementCtx, ZodNever, ZodTypeAny } from "zod";

import { Filter, FilterOperation } from "../types";
import { zod } from "./base";

type QueryParamTypes = "numeric" | "string" | "boolean" | "date";

type TransformOption = { isIndex?: boolean };

type OpenapiDoc = { description?: string; example?: any };

const updateContextFromError = (
    ctx: RefinementCtx,
    err: any,
    message: string
): ZodNever => {
    let msg: any;
    try {
        msg = JSON.parse(err.message);
    } catch {
        msg = message;
    }

    ctx.addIssue({ code: zod.ZodIssueCode.custom, message: msg });
    return zod.NEVER;
};

const numericQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: RefinementCtx,
    options?: TransformOption
): { op: FilterOperation; val: number | number[] | boolean } | ZodNever => {
    if (options?.isIndex) {
        return indexQueryParamTransform(field, value, context);
    }

    if (!value.includes(":")) {
        try {
            return { op: "eq", val: field.parse(Number(value)) };
        } catch (err) {
            return updateContextFromError(
                context,
                err,
                "Invalid number format"
            );
        }
    }
    const [op, val] = value.split(":");

    switch (op) {
        case "eq":
        case "ne":
        case "gt":
        case "gte":
        case "lt":
        case "lte":
            try {
                return { op, val: field.parse(Number(val)) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid number for ${op} operator`
                );
            }

        case "in":
        case "nin":
            try {
                const vals = val.split(",");
                return { op, val: zod.array(field).parse(vals) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid numeric options for ${op} operator`
                );
            }

        case "null":
            try {
                const boolValue = zod.coerce.boolean().parse(val);
                field.parse(boolValue);
                return { op, val: boolValue };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid boolean: ${val}`
                );
            }

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,gt,gte,lt,lte,in,nin,null`,
            });
            return zod.NEVER;
    }
};

const indexQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: RefinementCtx
): { op: FilterOperation; val: number | number[] | boolean } | ZodNever => {
    if (!value.includes(":")) {
        try {
            return { op: "eq", val: field.parse(Number(value)) };
        } catch (err) {
            return updateContextFromError(
                context,
                err,
                "Invalid index format - should be a number"
            );
        }
    }
    const [op, val] = value.split(":");

    switch (op) {
        case "eq":
        case "ne":
            try {
                return { op, val: field.parse(Number(val)) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid index for ${op} operator`
                );
            }

        case "in":
        case "nin":
            try {
                const vals = val.split(",");
                return { op, val: zod.array(field).parse(vals) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid index options for ${op} operator`
                );
            }

        case "null":
            try {
                const boolValue = zod.coerce.boolean().parse(val);
                field.parse(boolValue);
                return { op, val: boolValue };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid boolean: ${val}`
                );
            }

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,null,in,nin`,
            });
            return zod.NEVER;
    }
};

const stringQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: RefinementCtx
): { op: FilterOperation; val: string | string[] | boolean } | ZodNever => {
    if (!value.includes(":")) {
        try {
            return { op: "eq", val: field.parse(value) };
        } catch (err) {
            return updateContextFromError(
                context,
                err,
                "Invalid string format"
            );
        }
    }
    const [op, val] = value.split(":");

    switch (op) {
        case "eq":
        case "ne":
            try {
                return { op, val: field.parse(val) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid string for ${op} operator`
                );
            }

        case "in":
        case "nin":
            try {
                const vals = val.split(",");
                return { op, val: zod.array(field).parse(vals) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid string options for ${op} operator`
                );
            }

        case "null":
            try {
                const boolValue = zod.coerce.boolean().parse(val);
                field.parse(boolValue);
                return { op, val: boolValue };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid boolean: ${val}`
                );
            }

        case "like":
        case "ilike":
            return { op, val };

        case "regex":
            try {
                new RegExp(val);
                return { op, val };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid regex pattern: ${val}`
                );
            }

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,in,nin,null,like,ilike,regex`,
            });
            return zod.NEVER;
    }
};

const booleanQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: RefinementCtx
): { op: FilterOperation; val: boolean } | ZodNever => {
    if (!value.includes(":")) {
        try {
            return { op: "eq", val: field.parse(value === "true") };
        } catch (err) {
            return updateContextFromError(
                context,
                err,
                "Invalid boolean format (use 'true' or 'false')"
            );
        }
    }
    const [op, val] = value.split(":");

    switch (op) {
        case "eq":
        case "ne":
        case "null":
            try {
                const boolValue = zod.coerce.boolean().parse(val);
                field.parse(boolValue);
                return { op, val: boolValue };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid boolean: ${val}`
                );
            }

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,null`,
            });
            return zod.NEVER;
    }
};

const dateQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: RefinementCtx
): { op: FilterOperation; val: Date | Date[] | boolean } | ZodNever => {
    if (!value.includes(":")) {
        try {
            const date = new Date(value);
            return { op: "eq", val: field.parse(date) };
        } catch (err) {
            return updateContextFromError(
                context,
                err,
                "Invalid date format (use ISO 8601)"
            );
        }
    }
    const [op, val] = value.split(":");

    switch (op) {
        case "eq":
        case "ne":
        case "gt":
        case "gte":
        case "lt":
        case "lte":
            try {
                const date = new Date(val);
                return { op, val: field.parse(date) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid date for ${op} operator`
                );
            }

        case "in":
        case "nin":
            try {
                const vals = val.split(",");
                return { op, val: zod.array(field).parse(vals) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid date options format for ${op} operator`
                );
            }

        case "null":
            try {
                const boolValue = zod.coerce.boolean().parse(val);
                field.parse(boolValue);
                return { op, val: boolValue };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid boolean: ${val}`
                );
            }

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,gt,gte,lt,lte,in,nin,null`,
            });
            return zod.NEVER;
    }
};

const guessType = (field: ZodTypeAny): QueryParamTypes => {
    if (field instanceof zod.ZodNumber) {
        return "numeric";
    } else if (field instanceof zod.ZodString) {
        return "string";
    } else if (field instanceof zod.ZodBoolean) {
        return "boolean";
    } else if (field instanceof zod.ZodDate) {
        return "date";
    } else if (field instanceof zod.ZodTransformer) {
        return guessType(field._def.schema);
    } else if (field instanceof zod.ZodOptional) {
        return guessType(field._def.innerType);
    } else {
        throw new Error(`Could not guess the type of field ${field}`);
    }
};

export const httpFilter = (
    field: ZodTypeAny,
    doc?: OpenapiDoc,
    options?: TransformOption
): ZodTypeAny => {
    let transformFunction: (val: any, ctx: RefinementCtx) => any;
    const baseType = guessType(field);
    if (baseType === "numeric") {
        transformFunction = (val, ctx) =>
            numericQueryParamTransform(field, val, ctx, options);
    } else if (baseType === "string") {
        transformFunction = (val, ctx) =>
            stringQueryParamTransform(field, val, ctx);
    } else if (baseType === "boolean") {
        transformFunction = (val, ctx) =>
            booleanQueryParamTransform(field, val, ctx);
    } else if (baseType === "date") {
        transformFunction = (val, ctx) =>
            dateQueryParamTransform(field, val, ctx);
    } else {
        throw new Error(`Cannot use type ${field} as QueryParam`);
    }
    doc = doc || {};
    let { description, example } = doc;
    description = description || "";
    example = example || null;
    return zod
        .string()
        .openapi({ description, example })
        .transform(transformFunction);
};

const toFieldFilter = (filters: Filter[], ctx: RefinementCtx): Filter[] => {
    const usedOperators: FilterOperation[] = [];
    filters.forEach((f) => {
        // make sure no operator is used twice
        if (usedOperators.includes(f.op)) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `cannot use an operator twice for the same field. ${f.op} used multiple times`,
            });
        }
        usedOperators.push(f.op);
    });

    const length = usedOperators.length;
    const eqUsed = usedOperators.includes("eq");

    // Rule 1: eq should be used exclusively
    if (length >= 2 && eqUsed) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `eq can only be used exclusively. ${usedOperators} used at the same time`,
        });
    }

    // Rule 2: if eq not used than null should be used exclusively
    if (!eqUsed && usedOperators.includes("null") && length >= 2) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `null operator should be used exclusively. ${usedOperators} used at the same time`,
        });
    }

    // Rule 3: if eq not used than in should be used exclusively
    if (!eqUsed && usedOperators.includes("in") && length >= 2) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `in operator should be used exclusively. ${usedOperators} used at the same time`,
        });
    }

    // Rule 4: gt/gte cannot be used together
    if (usedOperators.includes("gt") && usedOperators.includes("gte")) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `gt and gte operators should not be used together. ${usedOperators} used at the same time`,
        });
    }

    // Rule 5: lt/lte cannot be used together
    if (usedOperators.includes("lt") && usedOperators.includes("lte")) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `lt and lte operators should not be used together. ${usedOperators} used at the same time`,
        });
    }

    // Rule 6: like/ilike cannot be used together
    if (usedOperators.includes("like") && usedOperators.includes("ilike")) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `like and ilike operators should not be used together. ${usedOperators} used at the same time`,
        });
    }

    // Rule 7: regex cannot be used with like/ilike
    if (
        usedOperators.includes("regex") &&
        (usedOperators.includes("ilike") || usedOperators.includes("ilike"))
    ) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: `regex should not be used along like or ilike operators. ${usedOperators} used at the same time`,
        });
    }

    return filters;
};

export const httpFilters = (
    field: ZodTypeAny,
    doc?: OpenapiDoc,
    options?: TransformOption
): ZodTypeAny => {
    return zod.array(httpFilter(field, doc, options)).transform(toFieldFilter);
};

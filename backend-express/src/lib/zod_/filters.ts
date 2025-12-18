import { RefinementCtx, ZodNever, ZodTypeAny } from "zod";

import { FilterOperation } from "../types";
import { zod } from "./base";

type QueryParamTypes = "numeric" | "string" | "boolean" | "date";

type TransformOption = { isIndexed?: boolean; isObjectId?: boolean };

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
    context: RefinementCtx
): { op: FilterOperation; val: number | number[] | boolean } | ZodNever => {
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

        case "exists":
            const boolValue = zod.coerce.boolean().parse(val);
            return { op, val: boolValue };

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,gt,gte,lt,lte,in,nin,exists`,
            });
            return zod.NEVER;
    }
};

const stringQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: RefinementCtx,
    options?: TransformOption
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

        case "exists":
            const boolValue = zod.coerce.boolean().parse(val);
            return { op, val: boolValue };

        case "regex":
            if (options?.isObjectId) {
                context.addIssue({
                    code: zod.ZodIssueCode.custom,
                    message: "regex search is not enabled objectId fields",
                });
                return zod.NEVER;
            }
            try {
                new RegExp(val);
                return { op, val };
            } catch {
                context.addIssue({
                    code: zod.ZodIssueCode.custom,
                    message: "Invalid regular expression",
                });
                return zod.NEVER;
            }

        case "text":
            if (!options?.isIndexed) {
                context.addIssue({
                    code: zod.ZodIssueCode.custom,
                    message: "Text search is not enabled for this field",
                });
                return zod.NEVER;
            }
            return { op, val };

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,in,nin,exists,regex,text`,
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
        case "exists":
            try {
                const boolValue = zod.coerce.boolean().parse(val);
                field.parse(boolValue);
                return { op, val: boolValue };
            } catch (err) {
                return updateContextFromError(context, err, "Invalid boolean");
            }

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,exists`,
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

        case "exists":
            try {
                return { op, val: zod.coerce.boolean().parse(val) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    "Invalid boolean value for exists operator"
                );
            }

        default:
            context.addIssue({
                code: zod.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,gt,gte,lt,lte,in,nin,exists`,
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
            numericQueryParamTransform(field, val, ctx);
    } else if (baseType === "string") {
        transformFunction = (val, ctx) =>
            stringQueryParamTransform(field, val, ctx, options);
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

export const httpFilters = (
    field: ZodTypeAny,
    doc?: OpenapiDoc,
    options?: TransformOption
): ZodTypeAny => {
    return zod.array(httpFilter(field, doc, options));
};

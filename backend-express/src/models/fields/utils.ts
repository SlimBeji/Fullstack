import { Types } from "mongoose";
import { ZodTypeAny } from "zod";

import { env } from "@/config";
import { ApiError, HttpStatus, MimeType } from "@/lib/express";
import { FilterOperation } from "@/lib/types";
import z from "@/zodExt";

//// Custom Fields ////

export const zodObjectId = () => {
    return z
        .string()
        .min(24)
        .refine((val) => Types.ObjectId.isValid(val), {
            message: "Must be a valid ObjectId",
        })
        .transform((val) => new Types.ObjectId(val));
};

const _zodFile = (
    acceptedMimetypes: string[] | null = null,
    maxSize: number = env.FILEUPLOAD_MAX_SIZE
) => {
    acceptedMimetypes = acceptedMimetypes || [MimeType.JPEG, MimeType.PNG];
    return z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string().refine((val) => acceptedMimetypes.includes(val)),
        size: z
            .number()
            .max(maxSize * 1024 * 1024, `File must be ≤${maxSize}MB`),
        buffer: z.instanceof(Buffer),
    });
};

export const zodFile = (
    description: string,
    acceptedMimetypes: string[] | null = null,
    maxSize: number = env.FILEUPLOAD_MAX_SIZE
) => {
    return z
        .any()
        .transform((val) => {
            const rs = _zodFile(acceptedMimetypes, maxSize);
            const result = rs.safeParse(val);
            if (!result.success) {
                throw new ApiError(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Invalid file upload"
                );
            }
            return result.data;
        })
        .openapi({
            type: "string",
            format: "binary",
            description,
        });
};

export const zodObject = (config: { [fieldname: string]: ZodTypeAny }) => {
    // Fix swagger UI error of stringifying objects
    return z.preprocess(
        (val) => (typeof val === "string" ? JSON.parse(val) : val),
        z.object(config)
    );
};

/// HttpFilters ////

type QueryParamTypes = "numeric" | "string" | "boolean" | "date";

type TransformOption = { isIndexed?: boolean; isObjectId?: boolean };

type OpenapiDoc = { description?: string; example?: any };

const updateContextFromError = (
    ctx: z.RefinementCtx,
    err: any,
    message: string
): z.ZodNever => {
    let msg: any;
    try {
        msg = JSON.parse(err.message);
    } catch {
        msg = message;
    }

    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg });
    return z.NEVER;
};

const numericQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: z.RefinementCtx
): { op: FilterOperation; val: number | number[] | boolean } | z.ZodNever => {
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
                return { op, val: z.array(field).parse(vals) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid numeric options for ${op} operator`
                );
            }

        case "exists":
            const boolValue = z.coerce.boolean().parse(val);
            return { op, val: boolValue };

        default:
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,gt,gte,lt,lte,in,nin,exists`,
            });
            return z.NEVER;
    }
};

const stringQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: z.RefinementCtx,
    options?: TransformOption
): { op: FilterOperation; val: string | string[] | boolean } | z.ZodNever => {
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
                return { op, val: z.array(field).parse(vals) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid string options for ${op} operator`
                );
            }

        case "exists":
            const boolValue = z.coerce.boolean().parse(val);
            return { op, val: boolValue };

        case "regex":
            if (options?.isObjectId) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "regex search is not enabled objectId fields",
                });
                return z.NEVER;
            }
            try {
                new RegExp(val);
                return { op, val };
            } catch {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Invalid regular expression",
                });
                return z.NEVER;
            }

        case "text":
            if (!options?.isIndexed) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Text search is not enabled for this field",
                });
                return z.NEVER;
            }
            return { op, val };

        default:
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,in,nin,exists,regex,text`,
            });
            return z.NEVER;
    }
};

const booleanQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: z.RefinementCtx
): { op: FilterOperation; val: boolean } | z.ZodNever => {
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
                const boolValue = z.coerce.boolean().parse(val);
                field.parse(boolValue);
                return { op, val: boolValue };
            } catch (err) {
                return updateContextFromError(context, err, "Invalid boolean");
            }

        default:
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,exists`,
            });
            return z.NEVER;
    }
};

const dateQueryParamTransform = (
    field: ZodTypeAny,
    value: any,
    context: z.RefinementCtx
): { op: FilterOperation; val: Date | Date[] | boolean } | z.ZodNever => {
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
                return { op, val: z.array(field).parse(vals) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid date options format for ${op} operator`
                );
            }

        case "exists":
            try {
                return { op, val: z.coerce.boolean().parse(val) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    "Invalid boolean value for exists operator"
                );
            }

        default:
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Unknown operator "${op}". Valid: eq,ne,gt,gte,lt,lte,in,nin,exists`,
            });
            return z.NEVER;
    }
};

const guessType = (field: ZodTypeAny): QueryParamTypes => {
    if (field instanceof z.ZodNumber) {
        return "numeric";
    } else if (field instanceof z.ZodString) {
        return "string";
    } else if (field instanceof z.ZodBoolean) {
        return "boolean";
    } else if (field instanceof z.ZodDate) {
        return "date";
    } else if (field instanceof z.ZodTransformer) {
        return guessType(field._def.schema);
    } else if (field instanceof z.ZodOptional) {
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
    let transformFunction: (val: any, ctx: z.RefinementCtx) => any;
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
    return z
        .string()
        .openapi({ description, example })
        .transform(transformFunction);
};

export const httpFilters = (
    field: ZodTypeAny,
    doc?: OpenapiDoc,
    options?: TransformOption
): ZodTypeAny => {
    return z.array(httpFilter(field, doc, options));
};

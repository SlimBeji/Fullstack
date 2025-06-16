import {
    z,
    ZodTypeAny,
    AnyZodObject,
    ZodObject,
    ZodOptional,
    ZodEffects,
    ZodArray,
} from "zod";
import { Types } from "mongoose";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { env } from "../../config";
import { HttpStatus, MimeType, ApiError, FilterOperation } from "../../types";

extendZodWithOpenApi(z);

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

type QueryParamTypes = "numeric" | "string" | "boolean" | "date";

type TransformOption = { isIndexed?: boolean };

type OpenapiDoc = { description?: string; example?: any };

const updateContextFromError = (
    ctx: z.RefinementCtx,
    err: any,
    message: string
): z.ZodNever => {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : message,
    });
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

    const [op, vals] = value.split(":");
    const val = vals.join(":");

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
                const arr = val.startsWith("[")
                    ? JSON.parse(val)
                    : [Number(val)];
                return { op, val: z.array(field).parse(arr) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid array format for ${op} operator`
                );
            }

        case "exists":
            let boolValue = z.coerce.boolean().parse(val);
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

    const [op, ...vals] = value.split(":");
    const val = vals.join(":");

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
                const arr = val.startsWith("[") ? JSON.parse(val) : [val];
                return { op, val: z.array(field).parse(arr) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid array format for ${op} operator`
                );
            }

        case "exists":
            let boolValue = z.coerce.boolean().parse(val);
            return { op, val: boolValue };

        case "regex":
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
                let boolValue = z.coerce.boolean().parse(val);
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

    const [op, ...vals] = value.split(":");
    const val = vals.join(":");

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
                const dates = val.startsWith("[")
                    ? JSON.parse(val).map((d: string) => new Date(d))
                    : [new Date(val)];
                return { op, val: z.array(field).parse(dates) };
            } catch (err) {
                return updateContextFromError(
                    context,
                    err,
                    `Invalid date array format for ${op} operator`
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

export const zodQueryParam = (
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
    return z.array(
        z
            .string()
            .openapi({ description, example })
            .transform(transformFunction)
    );
};

interface fieldDefinition {
    field: ZodTypeAny;
    isObject: boolean;
    isOptional: boolean;
    isArray: boolean;
}

const unwrapSchema = (schema: ZodTypeAny): fieldDefinition => {
    let isObject = false;
    let isOptional = false;
    let isArray = false;
    let field = schema;
    while (true) {
        if (field instanceof ZodOptional) {
            isOptional = true;
            field = field._def.innerType;
        } else if (field instanceof ZodEffects) {
            field = field._def.schema;
        } else if (field instanceof ZodArray) {
            isArray = true;
            field = field._def.type;
        } else {
            break;
        }
    }
    if (field instanceof ZodObject) isObject = true;
    return { field, isObject, isOptional, isArray };
};

export const flattenZodSchema = (
    schema: AnyZodObject,
    prefix = ""
): AnyZodObject => {
    const result: Record<string, any> = {};
    for (const key in schema.shape) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const { field, isArray, isObject, isOptional } = unwrapSchema(
            schema.shape[key]
        );
        if (isObject) {
            const flattened = flattenZodSchema(
                field as AnyZodObject,
                fullKey
            ).shape;
            Object.entries(flattened).forEach(([k, v]) => {
                result[k] = isOptional ? (v as any).optional() : v;
            });
        } else if (isArray) {
            let arrayField = z.array(field);
            result[fullKey] = isOptional ? arrayField.optional() : arrayField;
        } else {
            result[fullKey] = isOptional ? field.optional() : field;
        }
    }
    return z.object(result);
};

export const getZodFields = (
    schema: AnyZodObject,
    flatten: boolean = false
): Set<string> => {
    const flat = flatten ? flattenZodSchema(schema) : schema;
    return new Set(Object.keys(flat.shape));
};

const buildSort = (sortableFields: string[]): ZodTypeAny => {
    const fields: string[] = [];
    sortableFields.forEach((item) => {
        fields.push(item);
        fields.push(`-${item}`);
    });
    return z
        .array(z.enum(fields as [string, ...string[]]))
        .default([])
        .openapi(
            "Fields to use for sorting. Use the '-' for descending sorting"
        );
};

const buildPagination = () => {
    return {
        page: z.coerce.number().int().default(1).openapi("The page number"),
        size: z.coerce
            .number()
            .int()
            .max(env.MAX_ITEMS_PER_PAGE)
            .default(env.MAX_ITEMS_PER_PAGE)
            .openapi("Items per page"),
    };
};

export const buildSearchGetSchema = (
    schema: AnyZodObject,
    sortableFields: string[]
): AnyZodObject => {
    const flat = flattenZodSchema(schema);
    return flat.extend({
        ...buildPagination(),
        sort: buildSort(sortableFields),
    });
};

export const buildPaginatedSchema = (
    schema: AnyZodObject,
    description: string = "The page data"
): AnyZodObject => {
    return z.object({
        page: z.number().openapi("The returned page number"),
        totalPages: z.number().openapi("The total number of pages"),
        totalCount: z.number().openapi("Total number of items in the database"),
        data: z.array(schema).openapi(description),
    });
};

export { z };

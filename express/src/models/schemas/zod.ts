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
import { HttpStatus, MimeType, ApiError } from "../../types";

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

const fileRuntimeSchema = (
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
            const rs = fileRuntimeSchema(acceptedMimetypes, maxSize);
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

export const buildPaginationSchema = (
    schema: AnyZodObject,
    sortableFields: string[]
): AnyZodObject => {
    const fields: string[] = [];
    sortableFields.forEach((item) => {
        fields.push(item);
        fields.push(`-${item}`);
    });
    const flat = flattenZodSchema(schema);
    return flat.extend({
        page: z.number().default(1).openapi("The page number"),
        size: z
            .number()
            .default(env.MAX_ITEMS_PER_PAGE)
            .openapi("Items per page"),
        sort: z
            .array(z.enum(fields as [string, ...string[]]))
            .default([])
            .openapi(
                "Fields to use for sorting. Use the '-' for descending sorting"
            ),
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
        if (isObject || isArray) {
            const flattened = flattenZodSchema(
                field as AnyZodObject,
                fullKey
            ).shape;
            Object.entries(flattened).forEach(([k, v]) => {
                result[k] = isOptional ? (v as any).optional() : v;
            });
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

export { z };

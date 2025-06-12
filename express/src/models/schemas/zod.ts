import { z, ZodTypeAny, AnyZodObject } from "zod";
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

    return schema.extend({
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

export { z };

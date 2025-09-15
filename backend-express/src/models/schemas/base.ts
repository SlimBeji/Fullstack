import { AnyZodObject, z } from "zod";

import { env } from "../../config";

export const paginatedSchema = (
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

export const filtersSchema = (
    baseSchema: AnyZodObject,
    sortables: string[],
    searchables: string[]
): AnyZodObject => {
    const page = z.coerce.number().int().default(1).openapi("The page number");
    const size = z.coerce
        .number()
        .int()
        .max(env.MAX_ITEMS_PER_PAGE)
        .default(env.MAX_ITEMS_PER_PAGE)
        .openapi("Items per page");
    const sort = z
        .array(z.enum(sortables as [string, ...string[]]))
        .default(["-createdAt"])
        .openapi({
            description:
                "Fields to use for sorting. Use the '-' for descending sorting",
            example: ["-createdAt"],
        });
    const fields = z
        .array(z.enum(searchables as [string, ...string[]]))
        .openapi({
            description:
                "Fields to include in the response; omit for full document",
            example: ["-id"],
        })
        .optional();

    return baseSchema.extend({ page, size, sort, fields });
};

import { z } from "../../zod";
import { AnyZodObject } from "zod";
import Config from "../../config";

export const buildPaginationSchema = (
    schema: AnyZodObject,
    sortableFields: string[]
): AnyZodObject => {
    return schema.extend({
        page: z.number().default(1).openapi("The page number"),
        size: z
            .number()
            .default(Config.MAX_ITEMS_PER_PAGE)
            .openapi("Items per page"),
        sort: z
            .array(z.enum(sortableFields as [string, ...string[]]))
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

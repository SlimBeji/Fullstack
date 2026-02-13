import { AnyZodObject } from "zod";

import { zod } from "./base";

export const paginatedSchema = (
    schema: AnyZodObject,
    description: string = "The page data"
): AnyZodObject => {
    return zod.object({
        page: zod.number().openapi("The returned page number"),
        totalPages: zod.number().openapi("The total number of pages"),
        totalCount: zod
            .number()
            .openapi("Total number of items in the database"),
        data: zod.array(schema).openapi(description),
    });
};

export const filtersSchema = (
    baseSchema: AnyZodObject,
    sortables: readonly string[],
    selectables: readonly string[],
    maxItems: number = 100
): AnyZodObject => {
    const page = zod.coerce
        .number()
        .int()
        .default(1)
        .openapi("The page number");
    const size = zod.coerce
        .number()
        .int()
        .max(maxItems)
        .default(maxItems)
        .openapi("Items per page");
    const sort = zod
        .array(zod.enum(sortables as [string, ...string[]]))
        .default(["-createdAt"])
        .openapi({
            description:
                "Fields to use for sorting. Use the '-' for descending sorting",
            example: ["-createdAt"],
        });
    const fields = zod
        .array(zod.enum(selectables as [string, ...string[]]))
        .openapi({
            description:
                "Fields to include in the response; omit for full document",
            example: ["id"],
        })
        .optional();

    return baseSchema.extend({ page, size, sort, fields });
};

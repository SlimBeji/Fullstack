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

export const getFieldsSectionSchema = (
    fields: readonly string[],
    defaut: string[]
) => {
    return zod
        .preprocess(
            (val) => (typeof val === "string" ? [val] : val),
            zod.array(zod.enum([...fields] as [string, ...string[]])).openapi({
                description:
                    "Fields to include in the response; omit for full document",
                example: [...defaut],
            })
        )
        .optional();
};

export const filtersSchema = (
    baseSchema: AnyZodObject,
    sortables: readonly string[],
    selectables: readonly string[],
    maxItems: number = 100,
    defaultSort: string[] | null = null,
    defaultFields: string[] | null = null
): AnyZodObject => {
    defaultSort = defaultSort || ["-createdAt"];
    defaultFields = defaultFields || ["id"];

    const page = zod.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .openapi("The page number");
    const size = zod.coerce
        .number()
        .int()
        .min(1)
        .max(maxItems)
        .default(maxItems)
        .openapi("Items per page");
    const sort = zod
        .array(zod.enum(sortables as [string, ...string[]]))
        .default(defaultSort)
        .openapi({
            description:
                "Fields to use for sorting. Use the '-' for descending sorting",
            example: defaultSort,
        })
        .optional();
    const fields = getFieldsSectionSchema(selectables, defaultFields);
    return baseSchema.extend({ page, size, sort, fields });
};

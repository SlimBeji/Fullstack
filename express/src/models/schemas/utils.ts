import { z } from "../../zod";
import { AnyZodObject } from "zod";

export const buildPaginatedSchema = (
    schema: AnyZodObject,
    description: string = ""
): AnyZodObject => {
    description = description || "The page data";
    return z.object({
        page: z.number().openapi("The returned page number"),
        totalPages: z.number().openapi("The total number of pages"),
        totalCount: z.number().openapi("Total number of items in the database"),
        data: z.array(schema).openapi(description),
    });
};

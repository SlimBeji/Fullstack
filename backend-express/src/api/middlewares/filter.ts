import { NextFunction, Request, RequestHandler, Response } from "express";
import { ParsedQs } from "qs";
import { AnyZodObject } from "zod";

import { env } from "@/config";
import { HttpStatus } from "@/lib/express";
import { ApiError, Filter } from "@/types";

const GLOBAL_PARAMS = new Set(["page", "size", "sort", "fields"]);

const extractQueryParam = (req: Request, key: string): string[] | undefined => {
    const raw = req.query[key];
    if (!raw) return undefined;

    let values: (string | ParsedQs)[] = [];
    if (!Array.isArray(raw)) {
        values = [raw];
    } else {
        values = raw;
    }

    const result: string[] = [];
    values.forEach((item) => {
        if (typeof item === "string") {
            result.push(item.trim());
        } else {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `Following format is not supported for query params: ${item}`
            );
        }
    });
    return result;
};

const extractQueryParams = (
    req: Request,
    allowedFields: string[]
): Record<string, string[]> => {
    const allowedSet = new Set(allowedFields);
    const result: Record<string, string[]> = {};

    // Iterate over all keys
    for (const key in req.query) {
        // Skip ignored fields and unset properties
        if (!Object.prototype.hasOwnProperty.call(req.query, key)) {
            continue;
        }

        // Raise error if the field is unknown
        if (!allowedSet.has(key)) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `Unknown filter field: '${key}'. Allowed fields are: ${Array.from(
                    allowedSet
                ).join(", ")}.`
            );
        }

        if (req.query[key]) {
            const extracted = extractQueryParam(req, key);
            if (extracted) result[key] = extracted;
        }
    }
    return result;
};

const extractFilters = (
    body: Record<string, Filter[]>
): Record<string, Filter[]> => {
    const result: Record<string, Filter[]> = {};
    for (const [key, values] of Object.entries(body)) {
        if (GLOBAL_PARAMS.has(key)) continue;
        result[key] = values;
    }
    return result;
};

export const filter = (
    zodSchema: AnyZodObject,
    location: "query" | "body"
): RequestHandler => {
    return async (req: Request, resp: Response, next: NextFunction) => {
        const filterFields = Object.keys(zodSchema.shape);
        const body =
            location === "body"
                ? req.body
                : extractQueryParams(req, filterFields);

        const parsing = zodSchema.strict().safeParse(body);
        if (!parsing.success) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Invalid query request",
                { details: parsing.error }
            );
        }
        const data = parsing.data;
        req.filterQuery = {
            page: data.page || 1,
            size: data.size || env.MAX_ITEMS_PER_PAGE,
            sort: data.sort || [],
            fields: data.fields || [],
            filters: extractFilters(data),
        };
        next();
    };
};

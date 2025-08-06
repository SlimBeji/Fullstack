import { NextFunction, Request, RequestHandler, Response } from "express";
import { ParsedQs } from "qs";
import { AnyZodObject } from "zod";

import { parseDotNotation } from "../../lib/utils";
import { getZodFields } from "../../models/schemas";
import {
    ApiError,
    FieldFilter,
    HttpStatus,
    MongoFieldFilters,
    MongoFieldsFilters,
    PaginationData,
    SortData,
} from "../../types";

const GLOBAL_PARAMS = new Set(["page", "size", "sort", "fields"]);

interface BaseFilterBody {
    page?: number;
    size?: number;
    sort?: string[];
    fields?: string[];
}

type FilterBody = BaseFilterBody & Record<string, FieldFilter[]>;

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
    zodSchema: AnyZodObject
): Record<string, string[]> => {
    const result: Record<string, string[]> = {};
    const allowedFilterFields = new Set(getZodFields(zodSchema));

    // Iterate over all keys
    for (const key in req.query) {
        // Skip ignored fields and unset properties
        if (!Object.prototype.hasOwnProperty.call(req.query, key)) {
            continue;
        }

        // Raise error if the field is unknown
        if (!allowedFilterFields.has(key)) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `Unknown filter field: '${key}'. Allowed fields are: ${Array.from(
                    allowedFilterFields
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

const toPaginationData = (page: number, size: number): PaginationData => {
    const skip = (page - 1) * size;
    return { page, size, skip };
};

const toSortData = (fields: string[]): SortData => {
    const result: SortData = {};
    fields.forEach((field: string) => {
        const order = field.startsWith("-") ? -1 : 1;
        if (order === -1) {
            field = field.substring(1);
        }
        result[field] = order;
    });
    return result;
};

const toMongoFilters = (body: FilterBody): MongoFieldsFilters => {
    const result: Record<string, MongoFieldFilters> = {};
    for (const [key, values] of Object.entries(body)) {
        if (GLOBAL_PARAMS.has(key)) continue;
        const fieldFilters: MongoFieldFilters = {};
        values.forEach(({ op, val }) => {
            if (op === "text") {
                fieldFilters[`$${op}`] = { $search: val };
            } else {
                fieldFilters[`$${op}`] = val;
            }
        });
        result[key] = fieldFilters;
    }

    return result;
};

const toProjection = (
    fields: string[] | undefined
): Record<string, 1> | undefined => {
    if (!fields || fields.length === 0) {
        return undefined;
    }

    const flatProjection: Record<string, 1> = {};
    fields.forEach((item) => {
        flatProjection[item] = 1;
    });
    return parseDotNotation(flatProjection);
};

export const filter = (
    zodSchema: AnyZodObject,
    location: "query" | "body"
): RequestHandler => {
    return async (req: Request, resp: Response, next: NextFunction) => {
        const body =
            location === "body" ? req.body : extractQueryParams(req, zodSchema);

        const parsing = zodSchema.strict().safeParse(body);
        if (!parsing.success) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Invalid query request",
                { details: parsing.error }
            );
        }

        const data = parsing.data;
        const pagination = toPaginationData(data.page, data.size);
        const sort = toSortData(data.sort);
        const filters = toMongoFilters(data);
        const projection = toProjection(data.fields);
        req.filterQuery = { pagination, sort, filters, projection };
        next();
    };
};

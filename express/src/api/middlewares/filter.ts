import { Request, Response, NextFunction, RequestHandler } from "express";
import {
    ApiError,
    MongoFilter,
    FilterOperation,
    HttpStatus,
    PaginationData,
    SortData,
    FilterData,
} from "../../types";
import { z, AnyZodObject, ZodTypeAny } from "zod";
import { env } from "../../config";
import { getZodFields } from "../../models/schemas";

const parsePaginationFields = (
    req: Request,
    maxSize: number
): PaginationData => {
    const pageField = typeof req.query.page === "string" ? req.query.page : "1";
    const page = Math.max(1, parseInt(pageField) || 1);

    const sizeField =
        typeof req.query.size === "string" ? req.query.size : `${maxSize}`;
    const size = Math.min(Math.max(1, parseInt(sizeField) || 1), maxSize);

    const skip = (page - 1) * size;

    return { page, size, skip };
};

const parseSortField = (req: Request, zodSchema: AnyZodObject): SortData => {
    const sortField = typeof req.query.sort === "string" ? req.query.sort : "";

    const fields = sortField
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

    const sortValidator = zodSchema.shape.sort;
    if (!sortValidator || !(sortValidator instanceof z.ZodType)) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `Something went wrong when parsing the request`
        );
    }

    try {
        sortValidator.parse(fields);
    } catch (err) {
        throw new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            `Sort parameter not valid`,
            { details: (err as Error).message }
        );
    }

    const result: SortData = {};
    fields.forEach((field) => {
        const order = field.startsWith("-") ? -1 : 1;
        if (order === -1) {
            field = field.substring(1);
        }
        result[field] = order;
    });
    return result;
};

const parseMongoFilters = (
    filters: {
        op: FilterOperation;
        val: any;
    }[]
): MongoFilter => {
    const result: MongoFilter = {};
    filters.forEach(({ op, val }) => {
        if (op === "text") {
            val = { $search: val };
        }
        result[`$${op}`] = val;
    });
    return result;
};

const parseFilterField = (
    req: Request,
    key: string,
    field: ZodTypeAny
): MongoFilter => {
    let raw = req.query[key];
    if (raw == undefined) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `Something went wrong, param ${key} could not be extracted`
        );
    }

    if (!Array.isArray(raw)) {
        raw = [raw];
    }

    const parsingResult = field.safeParse(raw);
    if (!parsingResult.success) {
        throw new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            `${key} parameter not valid`,
            parsingResult.error
        );
    }

    return parseMongoFilters(parsingResult.data);
};

const parseFilters = (req: Request, zodSchema: AnyZodObject): FilterData => {
    let filterObject: FilterData = {};

    // Flatten the zod schema first and extract query fields
    const ignoredFields = new Set(["page", "size", "sort"]);
    const allowedFilterFields = getZodFields(zodSchema);

    // Iterate over all keys
    for (const key in req.query) {
        // Skip ignored fields and unset properties
        if (
            !Object.prototype.hasOwnProperty.call(req.query, key) ||
            ignoredFields.has(key)
        ) {
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

        // Extract the operation and value
        const zodField = zodSchema.shape[key];
        if (!zodField || !(zodField instanceof z.ZodType)) {
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                `Something went wrong when parsing the request`
            );
        }
        const fieldFilter = parseFilterField(req, key, zodField);
        filterObject[key] = fieldFilter;
    }

    return filterObject;
};

export const filter = (
    zodSchema: AnyZodObject,
    maxSize: number | null = null
): RequestHandler => {
    maxSize = maxSize || env.MAX_ITEMS_PER_PAGE;
    return async (req: Request, resp: Response, next: NextFunction) => {
        try {
            const pagination = parsePaginationFields(req, maxSize);
            const sort = parseSortField(req, zodSchema);
            const filters = parseFilters(req, zodSchema);
            req.filterQuery = { pagination, sort, filters };
            next();
        } catch (err) {
            if (err instanceof ApiError) {
                next(err);
            }
            next(
                new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Something went wrong while parsing request",
                    { error: String(err) }
                )
            );
        }
    };
};

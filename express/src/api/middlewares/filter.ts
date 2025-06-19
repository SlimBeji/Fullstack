import { Request, Response, NextFunction, RequestHandler } from "express";
import { ParsedQs } from "qs";
import {
    ApiError,
    MongoFilter,
    HttpStatus,
    PaginationData,
    SortData,
    FilterData,
    ProjectionIncl,
    MongoBaseFilter,
} from "../../types";
import { z, AnyZodObject } from "zod";
import { env } from "../../config";
import { getZodFields } from "../../models/schemas";
import { parseDotNotation } from "../../lib/utils";

const GLOBAL_PARAMS = new Set(["page", "size", "sort", "fields"]);

const extract = (req: Request, key: string): string[] | undefined => {
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
            const filtered = item
                .split(",")
                .map((f) => f.trim())
                .filter((f) => f.length > 0);
            result.push(...filtered);
        } else {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `Following format is not supported for query params: ${item}`
            );
        }
    });
    return result;
};

const toPaginationData = (page: number, size: number): PaginationData => {
    const skip = (page - 1) * size;
    return { page, size, skip };
};

const parsePaginationFields = (
    req: Request,
    maxSize: number
): PaginationData => {
    const pageField = typeof req.query.page === "string" ? req.query.page : "1";
    const page = Math.max(1, parseInt(pageField) || 1);
    const sizeField =
        typeof req.query.size === "string" ? req.query.size : `${maxSize}`;
    const size = Math.min(Math.max(1, parseInt(sizeField) || 1), maxSize);
    return toPaginationData(page, size);
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

const parseSortField = (req: Request, zodSchema: AnyZodObject): SortData => {
    const fields = extract(req, "sort");
    if (!fields) return {};

    const sortValidator = zodSchema.shape.sort;
    if (!sortValidator || !(sortValidator instanceof z.ZodType)) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `Something went wrong when parsing the request`
        );
    }

    const parsing = sortValidator.safeParse(fields);
    if (!parsing.success) {
        throw new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            `Sort parameter not valid`,
            { details: parsing.error }
        );
    }

    return toSortData(parsing.data);
};

const extractParams = (
    req: Request,
    zodSchema: AnyZodObject
): Record<string, string[]> => {
    const result: Record<string, string[]> = {};
    const allowedFilterFields = new Set(getZodFields(zodSchema));

    // Iterate over all keys
    for (const key in req.query) {
        // Skip ignored fields and unset properties
        if (
            !Object.prototype.hasOwnProperty.call(req.query, key) ||
            GLOBAL_PARAMS.has(key)
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

        if (!!req.query[key]) {
            const extracted = extract(req, key);
            if (extracted) result[key] = extracted;
        }
    }

    return result;
};

const validateFilters = (
    body: any,
    schema: AnyZodObject
): Record<string, MongoBaseFilter[]> => {
    const newSchema = schema.omit({
        page: true,
        size: true,
        sort: true,
        fields: true,
    });

    const parsing = newSchema.safeParse(body);
    if (!parsing.success) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid request", {
            details: parsing.error,
        });
    }

    return parsing.data;
};

const toMongoFilters = (
    filters: Record<string, MongoBaseFilter[]>
): Record<string, MongoFilter> => {
    const result: Record<string, MongoFilter> = {};
    for (const [key, values] of Object.entries(filters)) {
        if (GLOBAL_PARAMS.has(key)) continue;
        const fieldFilters: MongoFilter = {};
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

const parseFilters = (req: Request, schema: AnyZodObject): FilterData => {
    const paramsMap = extractParams(req, schema);
    const filters = validateFilters(paramsMap, schema);
    return toMongoFilters(filters);
};

export const filterGet = (
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

const toProjection = (
    fields: string[] | undefined
): ProjectionIncl | undefined => {
    if (!fields || fields.length === 0) {
        return undefined;
    }

    const flatProjection: Record<string, 1> = {};
    fields.forEach((item) => {
        flatProjection[item] = 1;
    });
    return parseDotNotation(flatProjection);
};

export const filterPost = (
    zodSchema: AnyZodObject,
    maxSize: number | null = null
): RequestHandler => {
    maxSize = maxSize || env.MAX_ITEMS_PER_PAGE;
    return async (req: Request, resp: Response, next: NextFunction) => {
        try {
            const parsing = zodSchema.strict().safeParse(req.body);
            if (!parsing.success) {
                throw new ApiError(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Invalid query request",
                    { details: parsing.error }
                );
            }

            const data = parsing.data as z.infer<typeof zodSchema>;
            const pagination = toPaginationData(data.page, data.size);
            const sort = toSortData(data.sort);
            const filters = toMongoFilters(data);
            const projection = toProjection(data.fields);
            req.filterQuery = { pagination, sort, filters, projection };
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

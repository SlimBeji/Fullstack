import { Request, Response, NextFunction, RequestHandler } from "express";
import { ParsedQs } from "qs";
import {
    ApiError,
    MongoFilter,
    MongoOperation,
    HttpStatus,
    PaginationData,
    SortData,
    FilterData,
    ProjectionIncl,
} from "../../types";
import { z, AnyZodObject, ZodTypeAny } from "zod";
import { env } from "../../config";
import { getZodFields } from "../../models/schemas";
import { parseDotNotation } from "../../lib/utils";

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

    const result: SortData = {};
    parsing.data.forEach((field: string) => {
        const order = field.startsWith("-") ? -1 : 1;
        if (order === -1) {
            field = field.substring(1);
        }
        result[field] = order;
    });
    return result;
};

const parseProjection = (
    req: Request,
    zodSchema: AnyZodObject
): ProjectionIncl | undefined => {
    const fields = extract(req, "fields");
    if (!fields) return undefined;

    const zodFields = zodSchema.shape.fields;
    if (!zodFields || !(zodFields instanceof z.ZodType)) return undefined;

    const parsing = zodFields.safeParse(fields);
    if (!parsing.success) {
        throw new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "Could not parse the fields requested",
            { details: parsing.error }
        );
    }

    const flatProjection: Record<string, 1> = {};
    (parsing.data as string[]).forEach((item) => {
        flatProjection[item] = 1;
    });
    return parseDotNotation(flatProjection);
};

const parseMongoFilters = (
    filters: {
        op: MongoOperation;
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
    const ignoredFields = new Set(["page", "size", "sort", "fields"]);
    const allowedFilterFields = new Set(getZodFields(zodSchema));

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
            const projection = parseProjection(req, zodSchema);
            const filters = parseFilters(req, zodSchema);
            req.filterQuery = { pagination, sort, projection, filters };
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

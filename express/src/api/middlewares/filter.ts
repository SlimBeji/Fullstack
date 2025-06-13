import { Request, Response, NextFunction, RequestHandler } from "express";
import { ParsedQs } from "qs";
import {
    ApiError,
    MongoFilter,
    MongoOperationMapping,
    FilterOperation,
    HttpStatus,
    PaginationData,
    SortData,
    FilterData,
} from "../../types";
import { AnyZodObject, ZodTypeAny } from "zod";
import { flattenZodSchema } from "../../models/schemas";
import { env } from "../../config";
import { parseDotNotation } from "../../lib/utils";

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

const parseSortField = (req: Request, allowedFields: string[]): SortData => {
    const sortField = typeof req.query.sort === "string" ? req.query.sort : "";

    const fields = sortField
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

    const result: SortData = {};
    fields.forEach((field) => {
        const order = field.startsWith("-") ? -1 : 1;
        if (order === -1) {
            field = field.substring(1);
        }
        if (allowedFields.indexOf(field) === -1) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `Cannot sort on field ${field}. Allowed fields are ${allowedFields}`
            );
        }
        result[field] = order;
    });
    return result;
};

const parseFilterValue = (
    fieldValue: string | ParsedQs,
    key: string
): [FilterOperation, any] => {
    // Checking the right format
    if (typeof fieldValue === "object") {
        throw new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            `param ${key} does not respect the format ${key}=op:val or ${key}=val (${key}=eq:5)`
        );
    }

    const parts = fieldValue.split(":");
    let op: FilterOperation = "eq";
    let value: any = "";
    if (parts.length === 1) {
        value = parts[0];
    } else if (parts.length === 2) {
        if (!(parts[0] in MongoOperationMapping)) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `Unknown operation ${parts[0]} for param ${key}`
            );
        }
        op = parts[0] as FilterOperation;
        value = parts[1];
    } else {
        throw new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            `param ${key} does not respect the format ${key}=op:val or ${key}=val (${key}=eq:5)`
        );
    }

    return [op, value];
};

const parseFilterField = (
    req: Request,
    key: string,
    schema: AnyZodObject
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

    const result: MongoFilter = {};
    raw.forEach((item) => {
        const [op, value] = parseFilterValue(item, key);
        const fieldSchema: ZodTypeAny = schema.shape[key];
        const parsing = fieldSchema.safeParse(value);
        if (!parsing.success) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                `${key} parameter not valid`,
                parsing.error
            );
        }
        result[`$${op}`] = value;
    });

    return result;
};

const parseFilters = (req: Request, zodSchema: AnyZodObject): FilterData => {
    let flatData: any = {};
    let filterObject: FilterData = {};

    // Flatten the zod schema first and extract query fields
    const ignoredFields = new Set(["page", "size", "sort"]);
    const flatSchema = flattenZodSchema(zodSchema);
    const allowedFilterFields = new Set(Object.keys(flatSchema.shape));

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
        const fieldFilter = parseFilterField(req, key, flatSchema);
        filterObject[key] = fieldFilter;
        if (MongoOperationMapping.eq in fieldFilter) {
            flatData[key] = fieldFilter[MongoOperationMapping.eq];
        }
    }

    // Handle dot notation and validate the whole data with eq: operation
    const nestedData = parseDotNotation(flatData);
    const validationResult = zodSchema.safeParse(nestedData);
    if (!validationResult.success) {
        throw new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "request not valid",
            validationResult.error
        );
    }

    return filterObject;
};

export const filter = (
    zodSchema: AnyZodObject,
    sortableFields: string[],
    maxSize: number | null = null
): RequestHandler => {
    maxSize = maxSize || env.MAX_ITEMS_PER_PAGE;
    return async (req: Request, resp: Response, next: NextFunction) => {
        try {
            const pagination = parsePaginationFields(req, maxSize);
            const sort = parseSortField(req, sortableFields);
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

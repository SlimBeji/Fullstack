import { Request, Response, NextFunction, RequestHandler } from "express";
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
import config from "../../config";
import { parseDotNotation } from "../../lib/utils";

const parsePaginationFields = (
    req: Request,
    maxSize: number
): PaginationData => {
    const pageField = typeof req.query.page === "string" ? req.query.page : "1";
    const page = Math.max(1, parseInt(pageField) || 1);

    const sizeField = typeof req.query.size === "string" ? req.query.size : "1";
    const size = Math.min(Math.max(1, parseInt(sizeField) || 1), maxSize);

    return { page, size };
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
            throw new Error(
                `Cannot sort on field ${field}. Allowed fields are ${allowedFields}`
            );
        }
        result[field] = order;
    });
    return result;
};

const parseFilterField = (
    req: Request,
    key: string,
    schema: AnyZodObject
): MongoFilter => {
    let raw = req.query[key];
    if (raw == undefined) {
        throw new Error(
            `Something went wrong, param ${key} could not be extracted`
        );
    }

    if (!Array.isArray(raw)) {
        raw = [raw];
    }

    const result: MongoFilter = {};
    raw.forEach((item) => {
        if (typeof item === "object") {
            throw new Error(
                `param ${key} does not respect the format ${key}=op:val or ${key}=val (${key}=eq:5)`
            );
        }
        const parts = item.split(":");
        let op: FilterOperation = "eq";
        let value: any = "";
        if (parts.length === 1) {
            value = parts[0];
        } else if (parts.length === 2) {
            if (!(parts[0] in MongoOperationMapping)) {
                throw new Error(
                    `Unknown operation ${parts[0]} for param ${key}`
                );
            }
            op = parts[0] as FilterOperation;
            value = parts[1];
        } else {
            throw new Error(
                `param ${key} does not respect the format ${key}=op:val or ${key}=val (${key}=eq:5)`
            );
        }

        const fieldSchema: ZodTypeAny = schema.shape[key];
        fieldSchema.parse(value);
        result[`$${op}`] = value;
    });

    return result;
};

const parseFilters = (req: Request, zodSchema: AnyZodObject): FilterData => {
    let data: any = {};
    let filterObject: FilterData = {};

    // Ignore other parsed query fields and extract the possible filters
    const ignoredFields = new Set(["page", "size", "sort"]);
    const allowedFilterFields = new Set(Object.keys(zodSchema.shape));

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
            throw new Error(
                `Unknown filter field: '${key}'. Allowed fields are: ${Array.from(
                    allowedFilterFields
                ).join(", ")}.`
            );
        }

        // Extract the operation and value
        const fieldFilter = parseFilterField(req, key, zodSchema);
        filterObject[key] = fieldFilter;
        if (MongoOperationMapping.eq in fieldFilter) {
            data[key] = fieldFilter[MongoOperationMapping.eq];
        }
    }

    // Handle dot notation and validate the whole data with eq: operation
    data = parseDotNotation(data);
    const validationResult = zodSchema.safeParse(data);
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
    maxSize = maxSize || config.MAX_ITEMS_PER_PAGE;
    return async (req: Request, resp: Response, next: NextFunction) => {
        try {
            const pagination = parsePaginationFields(req, maxSize);
            const sort = parseSortField(req, sortableFields);
            const filters = parseFilters(req, zodSchema);
            req.filterQuery = { pagination, sort, filters };
            next();
        } catch (err) {
            if (err instanceof Error) {
                next(
                    new ApiError(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "request not valid",
                        { message: err.message }
                    )
                );
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

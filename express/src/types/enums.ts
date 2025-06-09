export enum HttpStatus {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    UNPROCESSABLE_ENTITY = 422,
    INTERNAL_SERVER_ERROR = 500,
}

export enum ContentType {
    multipartFormData = "multipart/form-data",
    applicationJson = "application/json",
}

export enum MimeType {
    JPEG = "image/jpeg",
    PNG = "image/png",
}

export enum CollectionEnum {
    USERS = "users",
    PLACES = "places",
}

export const MongoOperationMapping = {
    eq: "$eq",
    ne: "$ne",
    gt: "$gt",
    gte: "$gte",
    lt: "$lt",
    lte: "$lte",
    in: "$in",
    nin: "$nin",
    regex: "$regex",
    text: "$text",
} as const;

export type FilterOperation = keyof typeof MongoOperationMapping;

export type MongoFilter = { [key in `$${FilterOperation}`]?: any };

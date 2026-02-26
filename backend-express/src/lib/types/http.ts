export enum HttpStatus {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    CONFLICT = 409,
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

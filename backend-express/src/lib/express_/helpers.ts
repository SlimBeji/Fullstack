import { Request } from "express";

import { ApiError, ContentType, HttpStatus } from "../types";

export const getParamId = (req: Request, key: string): number => {
    const raw = req.params[key];
    if (!raw) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `failed to extract '${key}' url param`
        );
    }
    const value = Array.isArray(raw) ? raw[0] : raw;
    const id = parseInt(value, 10);
    if (isNaN(id)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `url param '${key}' is not a valid number`
        );
    }
    return id;
};

export const isMultipartFormData = (req: Request): boolean => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.startsWith(ContentType.multipartFormData)) {
        return true;
    }
    return false;
};

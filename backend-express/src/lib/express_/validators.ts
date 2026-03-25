import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodObject } from "zod";

import { ApiError, HttpStatus } from "../types";
import { isMultipartFormData } from "./helpers";

const checkBody = (req: Request, schema: ZodObject): ApiError | void => {
    const body = req.body;
    if (!body) {
        return new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "Bad request. No Body attached!"
        );
    }
    const result = schema.safeParse(body);
    if (!result.success) {
        return new ApiError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "request not valid",
            result.error.issues
        );
    }
    req.parsedBody = result.data;
};

export const validateBody = (schema: ZodObject, fileFields: string[] = []) => {
    return async function (req: Request, resp: Response, next: NextFunction) {
        const isMultipart = isMultipartFormData(req);
        if (isMultipart) {
            // Multipart form
            const multerObj = multer({});
            const config = fileFields.map((item) => {
                return { name: item };
            });
            const multerMiddleware = multerObj.fields(config);
            multerMiddleware(req, resp, (mErr) => {
                if (mErr) {
                    const err = new ApiError(
                        HttpStatus.BAD_REQUEST,
                        "Could not upload file",
                        { message: mErr.message }
                    );
                    return next(err);
                }
                if (!req.files) {
                    return next(
                        new ApiError(
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            "something went wrong while parsing multipart form"
                        )
                    );
                }
                const files = req.files as any as {
                    [fieldname: string]: File[];
                };
                fileFields.forEach((key) => {
                    if (files[key] && files[key].length > 0) {
                        req.body[key] = files[key][0];
                    } else {
                        req.body[key] = undefined;
                    }
                });
                return next(checkBody(req, schema));
            });
        } else {
            // Simple json post
            return next(checkBody(req, schema));
        }
    };
};

export const validateQuery = (schema: ZodObject) => {
    return async function (req: Request, _resp: Response, next: NextFunction) {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const err = new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "request not valid",
                result.error.issues
            );
            return next(err);
        }
        req.parsedQuery = result.data;
        return next();
    };
};

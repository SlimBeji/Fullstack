import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AnyZodObject, ZodTypeAny } from "zod";

import { isMultipartFormData } from "@/lib/express";
import { ApiError, HttpStatus } from "@/types";

const isFileField = (field: ZodTypeAny | any): boolean => {
    if (field._def?.openapi?.metadata?.format === "binary") {
        return true;
    }
    return false;
};

const getFileFields = (schema: AnyZodObject): string[] => {
    const fields: string[] = [];
    for (const [key, fieldSchema] of Object.entries(schema.shape)) {
        if (isFileField(fieldSchema)) {
            fields.push(key);
        }
    }
    return fields;
};

const checkBody = (req: Request, schema: AnyZodObject): ApiError | void => {
    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
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
            result.error
        );
    }
    req.parsed = result.data;
};

export const validateBody = (schema: AnyZodObject) => {
    return async function (req: Request, resp: Response, next: NextFunction) {
        const fileFields = getFileFields(schema);
        const isMultipart = isMultipartFormData(req);
        if (isMultipart) {
            // Multipart form
            const multerObj = multer({});
            const config = fileFields.map((item) => {
                return { name: item };
            });
            const multerMiddleware = multerObj.fields(config);
            multerMiddleware(req, resp, (mErr) => {
                if (mErr) return next(mErr);
                fileFields.forEach((key) => {
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

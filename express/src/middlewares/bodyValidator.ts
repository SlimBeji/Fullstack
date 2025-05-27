import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { ApiError, HttpStatus } from "../types";

export const validateBody = <T extends ZodType>(schema: T) => {
    return async function (req: Request, resp: Response, next: NextFunction) {
        const body = req.body;
        if (!body || Object.keys(body).length === 0) {
            next(
                new ApiError(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Bad request. No Body attached!"
                )
            );
        }

        const result = schema.safeParse(body);
        if (!result.success) {
            next(
                new ApiError(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "request not valid",
                    result.error
                )
            );
        }
        req.parsed = result.data;
        next();
    };
};

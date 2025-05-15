import { Response, NextFunction } from "express";
import { z, ZodType } from "zod";
import { ApiError, HttpStatus } from "../types";

type InferSchemaType<T extends ZodType> = z.infer<T>;

export const validateBody = <T extends ZodType>(schema: T) => {
    return async function (
        req: ParsedRequest<InferSchemaType<T>>,
        resp: Response,
        next: NextFunction
    ) {
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

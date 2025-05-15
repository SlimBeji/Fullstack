import "reflect-metadata";
import { Response, NextFunction } from "express";
import { z, ZodType } from "zod";
import { ApiError, HttpStatus } from "../../types";

export function bodyValidator<T extends ZodType>(schema: T) {
    return function (
        target: Object,
        key: string,
        desc: RequestHandlerDescriptor<z.infer<typeof schema>>
    ) {
        Reflect.defineMetadata("validator", schema, target, key);
    };
}

function validateBody<T extends ZodType>(schema: T): ParsedRequestHandler {
    return async function (
        req: ParsedRequest<z.infer<T>>,
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
}

export function getValidator(
    target: object,
    key: string
): ParsedRequestHandler | undefined {
    const schema: ZodType | undefined = Reflect.getMetadata(
        "validator",
        target,
        key
    );
    if (!schema) {
        return undefined;
    }
    return validateBody<z.infer<typeof schema>>(schema);
}

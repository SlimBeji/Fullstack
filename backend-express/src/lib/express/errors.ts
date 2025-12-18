import { NextFunction, Request, Response } from "express";

import { HttpStatus } from "./enums";

export class ApiError extends Error {
    constructor(
        public code: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        public message: string = "An unknown error occured",
        public details: object = {}
    ) {
        super(message);
    }
}

export const errorHandler = (
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // A response has been prepared
    if (res.headersSent) {
        return next(error);
    }

    // An error occured
    if (error) {
        const statusCode = error.code || 500;
        res.status(statusCode);
        const jsonResp: Record<string, any> = {
            error: true,
            message: error.message,
        };
        if (Object.keys(error.details).length > 0) {
            jsonResp["details"] = error.details;
        }
        if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
            console.error(error);
        }
        res.json(jsonResp);
        return;
    }
};

export const noRouteMatchHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    next(
        new ApiError(HttpStatus.BAD_REQUEST, "Wrong endpoint", {
            url: req.url,
        })
    );
};

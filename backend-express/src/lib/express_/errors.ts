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

    toJson(): Record<string, any> {
        const resp: Record<string, any> = {
            error: true,
            message: this.message,
        };
        if (this.details && Object.keys(this.details).length > 0) {
            resp["details"] = this.details;
        }
        return resp;
    }
}

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // A response has been prepared
    if (res.headersSent) {
        return next(error);
    }

    // Return if no error
    if (!error) return;

    // Convert to ApiError
    let apiError: ApiError;
    if (error instanceof ApiError) {
        apiError = error;
    } else {
        apiError = new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Something went wrong"
        );
    }

    // Log the server errors
    if (apiError.code === HttpStatus.INTERNAL_SERVER_ERROR) {
        console.error(error);
    }

    // Handling Response
    res.status(apiError.code);
    res.json(apiError.toJson());
    return;
};

export const noRouteMatchHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    next(
        new ApiError(HttpStatus.NOT_FOUND, "Wrong endpoint", {
            url: req.url,
        })
    );
};

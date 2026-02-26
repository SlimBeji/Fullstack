import { NextFunction, Request, Response } from "express";

import { ApiError, HttpStatus } from "../types";

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
    } else if (error instanceof SyntaxError) {
        apiError = new ApiError(HttpStatus.BAD_REQUEST, "Bad Request Syntax", {
            info: "if you are sending a json, check if it is valid",
        });
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

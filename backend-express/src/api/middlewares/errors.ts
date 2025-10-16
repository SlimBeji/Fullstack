import { NextFunction, Request, Response } from "express";

import { ApiError, HttpStatus } from "@/types";

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
        const jsonResp = {
            error: true,
            message: error.message,
            details: error.details,
        };
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

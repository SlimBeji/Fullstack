import { NextFunction, Request, Response } from "express";
import { ApiError, HttpStatus } from "../types";

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
        res.status(error.code || 500);
        const jsonResp = { message: error.message, details: error.details };
        console.error(error.message);
        console.error(error.details);
        res.json(jsonResp);
        return;
    }
};

export const noRouteMatchHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    next(new ApiError(HttpStatus.BAD_REQUEST, "Wrong endpoint"));
};

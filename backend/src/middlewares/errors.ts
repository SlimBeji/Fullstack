import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../enums";
import { ApiError } from "../framework";

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

    // No Route matched
    return next(new ApiError(HttpStatus.BAD_REQUEST, "Wrong endpoint"));
};

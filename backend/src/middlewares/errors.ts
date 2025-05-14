import { NextFunction, Request, Response } from "express";

import { ApiError, HttpStatus } from "../framework";

export const errorHandler = (
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (res.headersSent) {
        return next(error);
    }
    res.status(error.code || 500);
    const jsonResp = { message: error.message, details: error.details };
    console.error(error.message);
    console.error(error.details);
    res.json(jsonResp);
};

export const wrongRoute = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    return next(new ApiError(HttpStatus.BAD_REQUEST, "Wrong endpoint"));
};

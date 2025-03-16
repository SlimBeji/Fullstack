import { NextFunction, Request, Response } from "express";

import { ApiError } from "../models";

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
    res.json(jsonResp);
};

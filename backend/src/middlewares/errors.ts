import { NextFunction, Request, Response } from "express";

import { ApiError, HttpStatus } from "../framework";

export const wrongRoute = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    return next(new ApiError(HttpStatus.BAD_REQUEST, "Wrong endpoint"));
};

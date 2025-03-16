import { NextFunction, Request, Response } from "express";

import { ApiError, HttpStatus } from "../framework";

export const wrongRoute = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    return next(new ApiError(HttpStatus.BAD_REQUEST, "Wrong endpoint"));
};

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (req.session && req.session.loggedIn) {
        next();
        return;
    }
    res.status(403);
    res.send("Not Permitted");
};

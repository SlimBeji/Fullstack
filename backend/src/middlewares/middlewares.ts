import { NextFunction, Request, Response } from "express";

import { ApiError, HttpStatus } from "../framework";

export const cors = (req: Request, res: Response, next: NextFunction): void => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }

    next();
};

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

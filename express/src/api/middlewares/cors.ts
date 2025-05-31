import { NextFunction, Request, Response } from "express";

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

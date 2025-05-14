import { NextFunction, Request, Response } from "express";
import { ApiError, HttpStatus } from "../framework";
import { getUserFromToken } from "../auth";

const getError = (message?: string): ApiError => {
    const details = message ? { error: message } : {};
    return new ApiError(
        HttpStatus.UNAUTHORIZED,
        "Authentication Error",
        details
    );
};

const checkAuthToken = async (
    req: Request,
    isAdmin: boolean
): Promise<ApiError | null> => {
    const rawToken = req.headers.authorization || "";
    const match = rawToken.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];
    if (!token) {
        return getError("No Bearer token found");
    }

    try {
        const user = await getUserFromToken(token);
        if (isAdmin && !user.isAdmin) {
            return getError("Not an admin");
        }
        req.currentUser = user;
    } catch (err) {
        return getError("Token not valid");
    }
    return null;
};

export const Authenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    next(await checkAuthToken(req, false));
    return;
};

export const Admin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    next(await checkAuthToken(req, true));
    return;
};

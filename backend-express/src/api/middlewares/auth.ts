import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";

import { ApiError, HttpStatus } from "@/lib/express_";
import { crudUser } from "@/models/crud";
import { decodeToken, UserRead } from "@/models/schemas";

const getUserFromToken = async (token: string): Promise<UserRead> => {
    const payload = decodeToken(token);
    const user = await crudUser.get(payload.userId);
    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
    }
    if (user.email !== payload.email) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            "Invalid token, payload corrupted"
        );
    }
    return user;
};

const getError = (message: string): ApiError => {
    return new ApiError(HttpStatus.UNAUTHORIZED, message);
};

const checkAuthToken = async (
    req: Request,
    isAdmin: boolean
): Promise<ApiError | null> => {
    if (req.method === "OPTIONS") {
        return null;
    }

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
        if (err instanceof TokenExpiredError) {
            return getError("Token expired");
        }
        return getError("Token Not Valid");
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

export const getCurrentUser = (req: Request): UserRead => {
    if (!req.currentUser) {
        throw getError("No user loggged in");
    }
    return req.currentUser as UserRead;
};

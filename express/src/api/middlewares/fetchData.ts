import { NextFunction, Request, Response, RequestHandler } from "express";
import { checkAuthToken } from "./auth";
import { ApiError, HttpStatus } from "../../types";
import { crudUser } from "../../models/crud";

export const fetchUser = (checkAuth: boolean = true): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.params.userId;
        if (!userId) {
            next(
                new ApiError(HttpStatus.BAD_REQUEST, "UserId was not provided")
            );
        }
        const user = await crudUser.getDocument(userId);
        res.fetchedUser = user;
        if (checkAuth) {
            await checkAuthToken(req, false);
            const currentUser = req.currentUser!;
            if (currentUser.id !== user.id && !currentUser.isAdmin) {
                next(
                    new ApiError(
                        HttpStatus.UNAUTHORIZED,
                        `Access to user ${userId} refused`
                    )
                );
            }
        }
        next();
    };
};

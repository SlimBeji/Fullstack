import { NextFunction, Request, Response, RequestHandler } from "express";
import { checkAuthToken } from "./auth";
import { ApiError, HttpStatus } from "../../types";
import { crudUser } from "../../models/crud";
import { UserDocument } from "../../models/collections";

interface CrudGetter<D> {
    getDocument: (id: string) => Promise<D | null>;
}

const unauthorized = (name: string, id: string): ApiError => {
    return new ApiError(
        HttpStatus.UNAUTHORIZED,
        `Access to ${name} ${id} refused`
    );
};

const extractObject = async <D>(
    req: Request,
    idName: string,
    crud: CrudGetter<D>
): Promise<D> => {
    const id = req.params[idName];
    if (!id) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `${idName} was not provided`
        );
    }
    const document = await crud.getDocument(id);
    if (!document) {
        throw new ApiError(HttpStatus.NOT_FOUND, `Object ${id} was not found`);
    }
    return document;
};

export const fetchUser = (checkAuth: boolean = true): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        let user: UserDocument;
        try {
            user = await extractObject<UserDocument>(req, "userId", crudUser);
        } catch (err) {
            return next(err);
        }

        res.fetchedUser = user as UserDocument;
        if (checkAuth) {
            await checkAuthToken(req, false);
            const currentUser = req.currentUser!;
            if (currentUser.id !== user!.id && !currentUser.isAdmin) {
                next(unauthorized("User", user!.id));
            }
        }
        next();
    };
};

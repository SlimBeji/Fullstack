import { Response, NextFunction } from "express";

import {
    controller,
    get,
    put,
    del,
    ParsedRequest,
    bodyValidator,
} from "../framework";
import { crudUser, crudPlace } from "../models";
import { UserPut, UserPutSchema } from "../schemas";

@controller("/users")
export class UsersController {
    @get("/")
    public getUsers(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ): void {
        res.status(200).json(crudUser.userLookup("*"));
    }

    @get("/:userId")
    public getUser(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ): void {
        const user = crudUser.userLookup(req.params.userId)[0];
        res.status(200).json(user);
    }

    @bodyValidator(UserPutSchema)
    @put("/:userId")
    public editUser(
        req: ParsedRequest<UserPut>,
        res: Response,
        next: NextFunction
    ): void {
        const updatedUser = crudUser.updateUser(req.params.userId, req.parsed);
        res.status(200).json(updatedUser);
    }

    @del("/:userId")
    public deleteUser(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ): void {
        crudUser.deleteUser(req.params.userId);
        res.status(200).json({
            message: `Deleted user ${req.params.userId}`,
        });
    }

    @get("/:userId/places")
    public getPlace(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ): void {
        const places = crudPlace.placeLookup(req.params.userId, "creatorId");
        res.status(200).json(places);
    }
}

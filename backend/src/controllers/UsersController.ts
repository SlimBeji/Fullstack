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
    public async getUsers(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        res.status(200).json(await crudUser.search({}));
    }

    @get("/:userId")
    public async getUser(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        const user = await crudUser.get(req.params.userId);
        res.status(200).json(user);
    }

    @bodyValidator(UserPutSchema)
    @put("/:userId")
    public async editUser(
        req: ParsedRequest<UserPut>,
        res: Response,
        next: NextFunction
    ) {
        const updatedUser = await crudUser.update(
            req.params.userId,
            req.parsed
        );
        res.status(200).json(updatedUser);
    }

    @del("/:userId")
    public async deleteUser(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        await crudUser.delete(req.params.userId);
        res.status(200).json({
            message: `Deleted user ${req.params.userId}`,
        });
    }

    @get("/:userId/places")
    public async getPlace(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        const places = await crudPlace.search({ creatorId: req.params.userId });
        res.status(200).json(places);
    }
}

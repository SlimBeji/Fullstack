import { Router, Request, Response, NextFunction } from "express";

import { crudUser, crudPlace } from "../../models/crud";
import { UserPut, UserPutSchema } from "../../models/schemas";
import { PaginationParams, paginate, validateBody } from "../middlewares";

export const userRouter = Router();

async function getUsers(req: Request, res: Response, next: NextFunction) {
    const pagination = req.pagination as PaginationParams;
    res.status(200).json(await crudUser.search({}, pagination));
}
userRouter.get("/", paginate(), getUsers);

async function getUser(req: Request, res: Response, next: NextFunction) {
    const user = await crudUser.get(req.params.userId);
    res.status(200).json(user);
}
userRouter.get("/:userId", getUser);

async function editUser(req: Request, res: Response, next: NextFunction) {
    const parsed = req.parsed as UserPut;
    const updatedUser = await crudUser.update(req.params.userId, parsed);
    res.status(200).json(updatedUser);
}
userRouter.put("/:userId", validateBody(UserPutSchema), editUser);

async function deleteUser(req: Request, res: Response, next: NextFunction) {
    await crudUser.delete(req.params.userId);
    res.status(200).json({
        message: `Deleted user ${req.params.userId}`,
    });
}
userRouter.delete("/:userId", deleteUser);

async function getPlace(req: Request, res: Response, next: NextFunction) {
    const pagination = req.pagination as PaginationParams;
    const places = await crudPlace.search(
        { creatorId: req.params.userId },
        pagination
    );
    res.status(200).json(places);
}
userRouter.get("/:userId/places", paginate(), getPlace);

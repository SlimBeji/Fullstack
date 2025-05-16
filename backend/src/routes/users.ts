import { Router, Response, NextFunction, RequestHandler } from "express";

import { crudUser, crudPlace } from "../models";
import { UserPut, UserPutSchema } from "../schemas";
import { validateBody } from "../middlewares";

export const userRouter = Router();

async function getUsers(req: ParsedRequest, res: Response, next: NextFunction) {
    res.status(200).json(await crudUser.search({}));
}
userRouter.get("/", getUsers as RequestHandler);

async function getUser(req: ParsedRequest, res: Response, next: NextFunction) {
    const user = await crudUser.get(req.params.userId);
    res.status(200).json(user);
}
userRouter.get("/:userId", getUser as RequestHandler);

async function editUser(
    req: ParsedRequest<UserPut>,
    res: Response,
    next: NextFunction
) {
    const updatedUser = await crudUser.update(req.params.userId, req.parsed);
    res.status(200).json(updatedUser);
}
userRouter.put(
    "/:userId",
    validateBody(UserPutSchema) as RequestHandler,
    editUser as RequestHandler
);

async function deleteUser(
    req: ParsedRequest,
    res: Response,
    next: NextFunction
) {
    await crudUser.delete(req.params.userId);
    res.status(200).json({
        message: `Deleted user ${req.params.userId}`,
    });
}
userRouter.delete("/:userId", deleteUser as RequestHandler);

async function getPlace(req: ParsedRequest, res: Response, next: NextFunction) {
    const places = await crudPlace.search({ creatorId: req.params.userId });
    res.status(200).json(places);
}
userRouter.get("/:userId/places", getPlace as RequestHandler);

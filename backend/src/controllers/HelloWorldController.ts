import { Router, Request, Response, NextFunction } from "express";

import { Authenticated, Admin } from "../middlewares";

export const helloWorldRouter = Router();

async function hello(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({ message: "Hello World!" });
}
helloWorldRouter.get("/", hello);

async function helloUser(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({ message: `Hello ${req.currentUser?.name}!` });
}
helloWorldRouter.get("/user", Authenticated, helloUser);

async function helloAdmin(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({
        message: `Hello Admin ${req.currentUser?.name}!`,
    });
}
helloWorldRouter.get("/admin", Admin, helloAdmin);

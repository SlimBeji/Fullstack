import { Router, Request, Response, NextFunction } from "express";
import { z } from "../../zod";
import { Authenticated, Admin } from "../middlewares";
import { swaggerRegistery } from "../openapi";

export const helloWorldRouter = Router();

// Hello World Endpoint
async function hello(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({ message: "Hello World!" });
}

helloWorldRouter.get("/", hello);

swaggerRegistery.registerPath({
    method: "get",
    path: "/hello-world",
    responses: {
        200: {
            description: "A simple response with message field",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string().openapi({
                            example: "Hello World",
                        }),
                    }),
                },
            },
        },
    },
    tags: ["Hello World!"],
    summary: "Hello World Endpoint",
});

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

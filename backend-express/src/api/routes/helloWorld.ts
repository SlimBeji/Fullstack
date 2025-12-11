import { Request, Response, Router } from "express";

import { sendNewsletter } from "@/background/publishers";
import { zod } from "@/lib/zod";
import { UserRead } from "@/models/schemas";

import { swaggerRegistery } from "../docs";
import { Admin, Authenticated } from "../middlewares";

export const helloWorldRouter = Router();

// Hello World Endpoint
async function hello(req: Request, res: Response) {
    sendNewsletter("Slim", "mslimbeji@gmail.com");
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
                    schema: zod.object({
                        message: zod.string().openapi({
                            example: "Hello World",
                        }),
                    }),
                },
            },
        },
    },
    tags: ["Hello World"],
    summary: "Hello World Endpoint",
});

// Authenticated Hello World
async function helloUser(req: Request, res: Response) {
    const user = req.currentUser as UserRead;
    res.status(200).json({ message: `Hello ${user.name}!` });
}

helloWorldRouter.get("/user", Authenticated, helloUser);

swaggerRegistery.registerPath({
    method: "get",
    path: "/hello-world/user",
    responses: {
        200: {
            description: "A simple response with message field",
            content: {
                "application/json": {
                    schema: zod.object({
                        message: zod.string().openapi({
                            example: "Hello Slim",
                        }),
                    }),
                },
            },
        },
    },
    tags: ["Hello World"],
    summary: "Hello World Endpoint for authenticated users",
    security: [{ OAuth2Password: [] }],
});

// Hello World for admins
async function helloAdmin(req: Request, res: Response) {
    const user = req.currentUser as UserRead;
    res.status(200).json({
        message: `Hello Admin ${user.name}!`,
    });
}

helloWorldRouter.get("/admin", Admin, helloAdmin);

swaggerRegistery.registerPath({
    method: "get",
    path: "/hello-world/admin",
    responses: {
        200: {
            description: "A simple response with message field",
            content: {
                "application/json": {
                    schema: zod.object({
                        message: zod.string().openapi({
                            example: "Hello Admin Slim",
                        }),
                    }),
                },
            },
        },
    },
    tags: ["Hello World"],
    summary: "Hello World Endpoint for admins only",
    security: [{ OAuth2Password: [] }],
});

import { Request, Response, Router } from "express";

import { crudUser } from "../../models/crud";
import {
    EncodedTokenSchema,
    Signin,
    SigninSchema,
    Signup,
    SignupSchema,
} from "../../models/schemas";
import { validateBody } from "../middlewares";
import { swaggerRegistery } from "../openapi";

export const authRouter = Router();

// Signup route
async function signup(req: Request, res: Response) {
    const parsed = req.parsed as Signup;
    const tokenData = await crudUser.signup(parsed);
    res.status(200).json(tokenData);
}

authRouter.post("/signup", validateBody(SignupSchema), signup);

swaggerRegistery.registerPath({
    method: "post",
    path: "/auth/signup",
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: SignupSchema,
                },
            },
            description: "user signup form",
            required: true,
        },
    },
    responses: {
        200: {
            description: "User registered and received his access token",
            content: {
                "application/json": {
                    schema: EncodedTokenSchema,
                },
            },
        },
    },
    tags: ["Auth"],
    summary: "User registration",
});

// Signin in route
async function signin(req: Request, res: Response) {
    const parsed = req.parsed as Signin;
    const tokenData = await crudUser.signin(parsed);
    res.status(200).json(tokenData);
}

authRouter.post("/signin", validateBody(SigninSchema), signin);

swaggerRegistery.registerPath({
    method: "post",
    path: "/auth/signin",
    request: {
        body: {
            content: {
                "application/x-www-form-urlencoded": {
                    schema: SigninSchema,
                },
            },
            description: "user credentials",
            required: true,
        },
    },
    responses: {
        200: {
            description: "User logged in and received his access token",
            content: {
                "application/json": {
                    schema: EncodedTokenSchema,
                },
            },
        },
    },
    tags: ["Auth"],
    summary: "User authentication",
});

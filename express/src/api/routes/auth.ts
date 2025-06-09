import { Router, Response, Request, NextFunction } from "express";
import { fileUpload, extractFile, validateBody } from "../middlewares";
import { crudUser } from "../../models/crud";
import {
    Signin,
    SigninSchema,
    SignupBody,
    SignupBodySchema,
    SignupMultipartSchema,
    EncodedTokenSchema,
} from "../../models/schemas";
import { storage } from "../../lib/utils";
import { ApiError, HttpStatus } from "../../types";
import { swaggerRegistery } from "../openapi";

export const authRouter = Router();

// Signup route
async function signup(req: Request, res: Response, next: NextFunction) {
    const parsed = req.parsed as SignupBody;
    const image = extractFile(req, "image") || undefined;
    const tokenData = await crudUser.signup({ ...parsed, image });
    res.status(200).json(tokenData);
}

authRouter.post(
    "/signup",
    fileUpload([{ name: "image" }]),
    validateBody(SignupBodySchema),
    signup
);

swaggerRegistery.registerPath({
    method: "post",
    path: "/auth/signup",
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: SignupMultipartSchema,
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
async function signin(req: Request, res: Response, next: NextFunction) {
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
                "application/json": {
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

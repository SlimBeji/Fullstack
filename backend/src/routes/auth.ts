import { Router, Response, NextFunction, RequestHandler } from "express";
import { fileUpload, extractFile, validateBody } from "../middlewares";
import { crudUser } from "../models";
import { SigninForm, SigninSchema, SignupForm, SignupSchema } from "../schemas";
import { storage } from "../utils";
import { ApiError, HttpStatus } from "../types";

export const authRouter = Router();

async function signin(
    req: ParsedRequest<SigninForm>,
    res: Response,
    next: NextFunction
) {
    const tokenData = await crudUser.signin(req.parsed);
    res.status(200).json(tokenData);
}
authRouter.post(
    "/signin",
    validateBody(SigninSchema) as RequestHandler,
    signin as RequestHandler
);

async function signup(
    req: ParsedRequest<SignupForm>,
    res: Response,
    next: NextFunction
) {
    const duplicateMsg = await crudUser.checkDuplicate(
        req.parsed.email,
        req.parsed.name
    );
    if (duplicateMsg) {
        throw new ApiError(HttpStatus.BAD_REQUEST, duplicateMsg);
    }

    const imageFile = extractFile(req, "image");
    if (!imageFile) {
        throw new ApiError(HttpStatus.BAD_REQUEST, "No Image was provided");
    }

    req.parsed.imageUrl = await storage.uploadFile(imageFile);
    const tokenData = await crudUser.signup(req.parsed);
    res.status(200).json(tokenData);
}
authRouter.post(
    "/signup",
    fileUpload([{ name: "image" }]),
    validateBody(SignupSchema) as RequestHandler,
    signup as RequestHandler
);

import { Router, Response, Request, NextFunction } from "express";
import { fileUpload, extractFile, validateBody } from "../middlewares";
import { crudUser } from "../../models/crud";
import {
    SigninForm,
    SigninSchema,
    SignupForm,
    SignupSchema,
} from "../../models/schemas";
import { storage } from "../../lib/utils";
import { ApiError, HttpStatus } from "../../types";

export const authRouter = Router();

async function signin(req: Request, res: Response, next: NextFunction) {
    const parsed = req.parsed as SigninForm;
    const tokenData = await crudUser.signin(parsed);
    res.status(200).json(tokenData);
}
authRouter.post("/signin", validateBody(SigninSchema), signin);

async function signup(req: Request, res: Response, next: NextFunction) {
    const parsed = req.parsed as SignupForm;
    const duplicateMsg = await crudUser.checkDuplicate(
        parsed.email,
        parsed.name
    );
    if (duplicateMsg) {
        throw new ApiError(HttpStatus.BAD_REQUEST, duplicateMsg);
    }

    const imageFile = extractFile(req, "image");
    if (!imageFile) {
        throw new ApiError(HttpStatus.BAD_REQUEST, "No Image was provided");
    }

    parsed.imageUrl = await storage.uploadFile(imageFile);
    const tokenData = await crudUser.signup(parsed);
    res.status(200).json(tokenData);
}
authRouter.post(
    "/signup",
    fileUpload([{ name: "image" }]),
    validateBody(SignupSchema),
    signup
);

import { Response, NextFunction } from "express";

import {
    controller,
    post,
    bodyValidator,
    fileUploader,
    ParsedRequest,
    extractFile,
} from "../framework";
import { HttpStatus } from "../enums";
import { crudUser } from "../models";
import { SigninForm, SigninSchema, SignupForm, SignupSchema } from "../schemas";
import { storage } from "../utils";
import { ApiError } from "../types";

@controller("/auth")
export class AuthController {
    @fileUploader([{ name: "image" }])
    @bodyValidator(SignupSchema)
    @post("/signup")
    public async signup(
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

    @bodyValidator(SigninSchema)
    @post("/signin")
    public async signin(
        req: ParsedRequest<SigninForm>,
        res: Response,
        next: NextFunction
    ) {
        const tokenData = await crudUser.signin(req.parsed);
        res.status(200).json(tokenData);
    }
}

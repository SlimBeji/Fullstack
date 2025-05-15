import { Response, NextFunction } from "express";

import { controller, post, bodyValidator, use } from "../framework";
import { fileUpload, extractFile } from "../middlewares/fileupload";
import { crudUser } from "../models";
import { SigninForm, SigninSchema, SignupForm, SignupSchema } from "../schemas";
import { storage } from "../utils";
import { ApiError, HttpStatus } from "../types";

@controller("/auth")
export class AuthController {
    @use(fileUpload([{ name: "image" }]))
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

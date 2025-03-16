import { Response, NextFunction } from "express";

import { controller, post, bodyValidator, ParsedRequest } from "../framework";
import { crudUser } from "../models";
import { SigninForm, SigninSchema, SignupForm, SignupSchema } from "../schemas";

@controller("/auth")
export class AuthController {
    @bodyValidator(SignupSchema)
    @post("/signup")
    public signup(
        req: ParsedRequest<SignupForm>,
        res: Response,
        next: NextFunction
    ): void {
        const newUser = crudUser.createUser(req.parsed);
        res.status(200).json(newUser);
    }

    @bodyValidator(SigninSchema)
    @post("/signin")
    public signin(
        req: ParsedRequest<SigninForm>,
        res: Response,
        next: NextFunction
    ): void {
        const user = crudUser.authenticate(req.parsed);
        res.status(200).json(user);
    }
}

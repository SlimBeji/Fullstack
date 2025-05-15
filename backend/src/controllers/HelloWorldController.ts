import { Response, NextFunction } from "express";

import { Authenticated, Admin } from "../middlewares";
import { controller, get, use } from "../framework";

@controller("/hello-world")
export class HelloWorldController {
    @get("/")
    public async hello(req: ParsedRequest, res: Response, next: NextFunction) {
        res.status(200).json({ message: "Hello World!" });
    }

    @use(Authenticated)
    @get("/user")
    public async helloUser(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        res.status(200).json({ message: `Hello ${req.currentUser?.name}!` });
    }

    @use(Admin)
    @get("/admin")
    public async helloAdmin(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        res.status(200).json({
            message: `Hello Admin ${req.currentUser?.name}!`,
        });
    }
}

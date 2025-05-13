import { Response, NextFunction } from "express";

import { controller, get, ParsedRequest } from "../framework";

@controller("/hello-world")
export class HelloWorldController {
    @get("/")
    public async hello(req: ParsedRequest, res: Response, next: NextFunction) {
        res.status(200).json({ message: "Hello World!" });
    }

    @get("/admin")
    public async helloAdmin(
        req: ParsedRequest,
        res: Response,
        next: NextFunction
    ) {
        res.status(200).json({ message: "Hello Admin!" });
    }
}

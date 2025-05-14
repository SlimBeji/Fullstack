import "reflect-metadata";

import { AppRouter } from "./AppRouter";
import { getValidator } from "../decorators/bodyValidator";
import { getPath } from "../decorators/routes";
import { getMiddlewares } from "../decorators/use";
import { NextFunction, Response, RequestHandler } from "express";
import { ParsedRequest } from "../types";

const router = AppRouter.getInstance();

export function controller(prefix: string) {
    return function (target: Function) {
        Object.getOwnPropertyNames(target.prototype).forEach((key) => {
            const rootHandler = target.prototype[key];
            const { path, method } = getPath(target.prototype, key);
            const middlewares = getMiddlewares(target.prototype, key);
            const validator = getValidator(target.prototype, key);
            const handlers = [...middlewares];
            if (validator) handlers.push(validator);

            const wrapper = async (
                req: ParsedRequest,
                res: Response,
                next: NextFunction
            ): Promise<any> => {
                try {
                    return await rootHandler(req, res, next);
                } catch (err) {
                    next(err);
                }
            };
            handlers.push(wrapper);

            if (path) {
                router[method](
                    `${prefix}${path}`,
                    handlers as RequestHandler[]
                );
            }
        });
    };
}

import "reflect-metadata";

import { AppRouter } from "./AppRouter";
import { getValidator } from "../decorators/bodyValidator";
import { getPath } from "../decorators/routes";
import { getMiddlewares } from "../decorators/use";
import { RequestHandler } from "express";

const router = AppRouter.getInstance();

export function controller(prefix: string) {
    return function (target: Function) {
        Object.getOwnPropertyNames(target.prototype).forEach((key) => {
            const rootHandler = target.prototype[key];
            const { path, method } = getPath(target.prototype, key);
            const middlewares = getMiddlewares(target.prototype, key);
            const validator = getValidator(target.prototype, key);
            const handlers: RequestHandler[] = [...middlewares];
            if (validator) handlers.push(validator as RequestHandler);
            handlers.push(rootHandler);

            if (path) {
                router[method](`${prefix}${path}`, handlers);
            }
        });
    };
}

import "reflect-metadata";

import { RequestHandler } from "express";

export function use(middleware: ParsedRequestHandler | RequestHandler) {
    return function (
        target: Object,
        key: string,
        desc: RequestHandlerDescriptor
    ) {
        const middlewares: (ParsedRequestHandler | RequestHandler)[] =
            Reflect.getMetadata("middlewares", target, key) || [];

        middlewares.push(middleware);
        Reflect.defineMetadata("middlewares", middlewares, target, key);
    };
}

export function getMiddlewares(
    target: object,
    key: string
): (ParsedRequestHandler | RequestHandler)[] {
    return Reflect.getMetadata("middlewares", target, key) || [];
}

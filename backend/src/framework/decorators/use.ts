import "reflect-metadata";

import { RequestHandlerDescriptor, ParsedRequestHandler } from "../types";

export function use(middleware: ParsedRequestHandler) {
    return function (
        target: Object,
        key: string,
        desc: RequestHandlerDescriptor
    ) {
        const middlewares: ParsedRequestHandler[] =
            Reflect.getMetadata("middlewares", target, key) || [];

        middlewares.push(middleware);
        Reflect.defineMetadata("middlewares", middlewares, target, key);
    };
}

export function getMiddlewares(
    target: object,
    key: string
): ParsedRequestHandler[] {
    return Reflect.getMetadata("middlewares", target, key) || [];
}

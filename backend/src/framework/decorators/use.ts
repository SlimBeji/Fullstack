import "reflect-metadata";

import { RequestHandler } from "express";
import { MetadataKeys, RequestHandlerDescriptor } from "../types";

export function use(middleware: RequestHandler) {
    return function (
        target: Object,
        key: string,
        desc: RequestHandlerDescriptor
    ) {
        const middlewares: RequestHandler[] =
            Reflect.getMetadata(MetadataKeys.middlewares, target, key) || [];

        middlewares.push(middleware);
        Reflect.defineMetadata(
            MetadataKeys.middlewares,
            middlewares,
            target,
            key
        );
    };
}

export function getMiddlewares(target: object, key: string): RequestHandler[] {
    return Reflect.getMetadata(MetadataKeys.middlewares, target, key) || [];
}

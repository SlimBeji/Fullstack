import "reflect-metadata";

import { HttpMethods, MetadataKeys, RequestHandlerDescriptor } from "../types";

function routeBinder(method: string) {
    return function (path: string) {
        return function (
            target: Object,
            key: string,
            desc: RequestHandlerDescriptor
        ) {
            Reflect.defineMetadata(MetadataKeys.path, path, target, key);
            Reflect.defineMetadata(MetadataKeys.method, method, target, key);
        };
    };
}

export function getPath(
    target: object,
    key: string
): { method: HttpMethods; path: string } {
    const path = Reflect.getMetadata(MetadataKeys.path, target, key) || "";
    const method = Reflect.getMetadata(MetadataKeys.method, target, key) || "";
    return { path, method };
}

export const get = routeBinder(HttpMethods.get);
export const post = routeBinder(HttpMethods.post);
export const put = routeBinder(HttpMethods.put);
export const del = routeBinder(HttpMethods.delete);

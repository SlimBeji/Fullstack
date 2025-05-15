import "reflect-metadata";

function routeBinder(method: string) {
    return function (path: string) {
        return function (
            target: Object,
            key: string,
            desc: RequestHandlerDescriptor
        ) {
            Reflect.defineMetadata("path", path, target, key);
            Reflect.defineMetadata("method", method, target, key);
        };
    };
}

export function getPath(
    target: object,
    key: string
): { method: "get" | "post" | "put" | "delete"; path: string } {
    const path = Reflect.getMetadata("path", target, key) || "";
    const method = Reflect.getMetadata("method", target, key) || "";
    return { path, method };
}

export const get = routeBinder("get");
export const post = routeBinder("post");
export const put = routeBinder("put");
export const del = routeBinder("delete");

import { NextFunction, Response, Request } from "express";

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export type ParsedRequest<T = any> = Request & {
    parsed: T;
};

export type ParsedRequestHandler<T = any> = (
    req: ParsedRequest<T>,
    res: Response,
    next: NextFunction
) => Promise<any>;

export type RequestHandlerDescriptor<T = any> = TypedPropertyDescriptor<
    ParsedRequestHandler<T>
>;

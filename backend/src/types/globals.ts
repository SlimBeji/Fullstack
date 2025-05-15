import { Request, Response, NextFunction } from "express";

declare global {
    interface ParsedRequest<T = any> extends Request {
        parsed: T;
    }

    type ParsedRequestHandler<T = any> = (
        req: ParsedRequest<T>,
        res: Response,
        next: NextFunction
    ) => Promise<any> | void;

    type RequestHandlerDescriptor<T = any> = TypedPropertyDescriptor<
        ParsedRequestHandler<T>
    >;
}

export {};

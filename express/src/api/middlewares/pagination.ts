import { Request, Response, NextFunction, RequestHandler } from "express";
import config from "../../config";

export class PaginationParams {
    constructor(public readonly page: number, public readonly size: number) {}
    public get skip(): number {
        return (this.page - 1) * this.size;
    }
}

export const paginate = (maxSize: number | null = null): RequestHandler => {
    maxSize = maxSize || config.MAX_ITEMS_PER_PAGE;
    return async function name(
        req: Request,
        resp: Response,
        next: NextFunction
    ) {
        // Parse page, default is page 1
        let page = parseInt(req.query.page as string) || 1;
        page = Math.max(1, page);

        // Parse size, default is maxSize
        let size = parseInt(req.query.size as string) || maxSize;
        size = Math.min(Math.max(1, size), maxSize);

        // Update the request
        req.pagination = new PaginationParams(page, size);
        next();
    };
};

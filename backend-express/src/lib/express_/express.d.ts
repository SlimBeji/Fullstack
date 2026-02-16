import "express";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: any;
        parsedBody?: any;
        parsedQuery?: any;
    }
}

export {};

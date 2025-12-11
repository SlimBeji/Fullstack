import "express";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: any;
        parsed?: any;
    }
}

export {};

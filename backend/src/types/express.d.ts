import "express";
import { User } from "../schemas";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: User;
        parsed?: unknown;
        pagination?: unknown;
    }

    interface Application {
        env?: string;
    }
}

export {};

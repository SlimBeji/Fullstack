import "express";

import { UserRead } from "../models/schemas";
import { FilterQuery } from "./mongo";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: UserRead;
        parsed?: unknown;
        filterQuery?: FilterQuery;
    }

    interface Application {
        env?: string;
    }
}

export {};

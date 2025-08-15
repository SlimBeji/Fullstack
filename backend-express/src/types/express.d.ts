import "express";

import { UserRead } from "../models/schemas";
import { FindQuery } from "./mongo";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: UserRead;
        parsed?: unknown;
        filterQuery?: FindQuery;
    }
}

export {};

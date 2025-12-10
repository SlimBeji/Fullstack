import "express";

import { FindQuery } from "@/lib/types";
import { UserRead } from "@/models/schemas";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: UserRead;
        parsed?: unknown;
        filterQuery?: FindQuery;
    }
}

export {};

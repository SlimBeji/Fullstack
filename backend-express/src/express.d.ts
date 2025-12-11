import "express";

import { FindQuery } from "@/lib/types";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: any;
        parsed?: any;
        filterQuery?: FindQuery;
    }
}

export {};

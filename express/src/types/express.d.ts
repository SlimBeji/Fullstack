import "express";
import { PaginationData, SortData, FilterData, FilterQuery } from "./http";
import { Place, User } from "../models/schemas";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: User;
        parsed?: unknown;
        filterQuery?: FilterQuery;
    }

    interface Response {
        fetched: { user?: User; place?: Place };
    }

    interface Application {
        env?: string;
    }
}

export {};

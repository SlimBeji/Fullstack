import "express";
import { User } from "../schemas";
import { PaginationData, SortData, FilterData, FilterQuery } from "./http";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: User;
        parsed?: unknown;
        filterQuery?: FilterQuery;
    }

    interface Application {
        env?: string;
    }
}

export {};

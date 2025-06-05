import "express";
import { User } from "../schemas";
import { PaginationData, SortData, FilterData } from "./http";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: User;
        parsed?: unknown;
        pagination?: unknown;
        mongoQuery?: MongoQuery;
    }

    interface Application {
        env?: string;
    }

    interface MongoQuery {
        pagination: PaginationData;
        sort: SortData;
        filters: FilterData;
    }
}

export {};

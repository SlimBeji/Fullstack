import "express";
import { PaginationData, SortData, FilterData, FilterQuery } from "./http";
import { UserRead } from "../models/schemas";
import { PlaceDocument, UserDocument } from "../models/collections";

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

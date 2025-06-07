import "express";
import { PaginationData, SortData, FilterData, FilterQuery } from "./http";
import { User } from "../models/schemas";
import { PlaceDocument, UserDocument } from "../models/collections";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: User;
        parsed?: unknown;
        filterQuery?: FilterQuery;
    }

    interface Response {
        fetchedUser?: UserDocument;
        fetchedPlace?: PlaceDocument;
    }

    interface Application {
        env?: string;
    }
}

export {};

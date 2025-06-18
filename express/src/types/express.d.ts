import "express";

import { FilterQuery } from "./mongo";
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

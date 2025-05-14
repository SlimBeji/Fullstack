import "express";
import { User } from "../schemas";

declare module "express-serve-static-core" {
    interface Request {
        currentUser?: User;
    }

    interface Application {
        env?: string;
    }
}

import "express";

declare module "express-serve-static-core" {
    interface Application {
        env?: string;
    }
}

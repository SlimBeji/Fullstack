import { Application } from "express";

import { authRouter } from "./auth";
import { helloWorldRouter } from "./helloWorld";
import { placeRouter } from "./places";
import { userRouter } from "./users";

export const registerRoutes = (app: Application): void => {
    app.use("/api/hello-world", helloWorldRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/users", userRouter);
    app.use("/api/places", placeRouter);
};

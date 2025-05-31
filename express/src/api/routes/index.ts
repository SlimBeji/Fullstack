import { Application } from "express";
import { helloWorldRouter } from "./helloWorld";
import { authRouter } from "./auth";
import { userRouter } from "./users";
import { placeRouter } from "./places";

export const registerRoutes = (app: Application): void => {
    app.use("/api/hello-world", helloWorldRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/users", userRouter);
    app.use("/api/places", placeRouter);
};

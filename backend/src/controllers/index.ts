import { Application } from "express";
import { helloWorldRouter } from "./HelloWorldController";
import { authRouter } from "./AuthController";
import { userRouter } from "./UsersController";
import { placeRouter } from "./PlacesController";

export const registerRoutes = (app: Application): void => {
    app.use("/api/hello-world", helloWorldRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/users", userRouter);
    app.use("/api/places", placeRouter);
};

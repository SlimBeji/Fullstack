import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import "./controllers";

import { AppRouter, errorHandler } from "./framework";
import { wrongRoute, cors } from "./middlewares";

const SECRET_KEY = "NOT_VERY_SECRET";
const app = express();
const router = AppRouter.getInstance();
app.use(bodyParser.json());
app.use(cors);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({ keys: [SECRET_KEY] }));
app.use("/api", router);
app.use(wrongRoute);
app.use(errorHandler);

mongoose
    .connect(process.env.MONGO_URL!, { dbName: "myapp" })
    .then(() => {
        app.listen(3000, () => {
            console.log("Listening on port 3000");
        });
    })
    .catch(() => {
        console.log("Could not stablish connection to database");
    });

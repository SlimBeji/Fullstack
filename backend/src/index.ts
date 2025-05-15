import express from "express";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import "./controllers";
import { helloWorldRouter } from "./controllers";

import {
    PORT,
    ENV,
    SECRET_KEY,
    JSON_MAX_SIZE,
    MONGO_URL,
    MONGO_DBNAME,
} from "./config";
import { AppRouter } from "./framework";
import { errorHandler, cors } from "./middlewares";

const app = express();
app.env = ENV;
const router = AppRouter.getInstance();

app.use(cors);
app.use(express.json({ limit: JSON_MAX_SIZE }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ keys: [SECRET_KEY] }));
app.use("/api", router);
app.use("/api/hello-world", helloWorldRouter);
app.use(errorHandler);

mongoose
    .connect(MONGO_URL!, { dbName: MONGO_DBNAME })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Listening on port ${PORT}`);
        });
    })
    .catch(() => {
        console.log("Could not stablish connection to database");
    });

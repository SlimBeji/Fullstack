import "express-async-errors";
import express from "express";
import mongoose from "mongoose";
import cookieSession from "cookie-session";

import {
    PORT,
    ENV,
    SECRET_KEY,
    JSON_MAX_SIZE,
    MONGO_URL,
    MONGO_DBNAME,
} from "./config";
import { errorHandler, cors, noRouteMatchHandler } from "./middlewares";
import { registerRoutes } from "./routes";

const app = express();
app.env = ENV;

app.use(cors);
app.use(express.json({ limit: JSON_MAX_SIZE }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ keys: [SECRET_KEY] }));
registerRoutes(app);
app.all("*", noRouteMatchHandler);
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

import "express-async-errors";
import express from "express";
import mongoose from "mongoose";
import cookieSession from "cookie-session";

import config from "./config";
import { errorHandler, cors, noRouteMatchHandler } from "./middlewares";
import { registerRoutes } from "./routes";

const app = express();
app.env = config.ENV;

app.use(cors);
app.use(express.json({ limit: config.JSON_MAX_SIZE }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ keys: [config.SECRET_KEY] }));
registerRoutes(app);
app.all("*", noRouteMatchHandler);
app.use(errorHandler);

mongoose
    .connect(config.MONGO_URL!, { dbName: config.MONGO_DBNAME })
    .then(() => {
        app.listen(config.PORT, () => {
            console.log(`Listening on port ${config.PORT}`);
        });
    })
    .catch(() => {
        console.log("Could not stablish connection to database");
    });

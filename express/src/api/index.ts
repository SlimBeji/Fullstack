import "express-async-errors";
import express from "express";
import cookieSession from "cookie-session";

import config from "../config";
import { errorHandler, cors, noRouteMatchHandler } from "./middlewares";
import { registerRoutes } from "./routes";
import { registerSwaggger } from "./openapi";

const app = express();
app.env = config.ENV;

app.use(cors);
app.use(express.json({ limit: config.JSON_MAX_SIZE }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ keys: [config.SECRET_KEY] }));
registerRoutes(app);
registerSwaggger(app, "/docs");
app.use(noRouteMatchHandler);
app.use(errorHandler);

export default app;

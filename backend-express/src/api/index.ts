import "express-async-errors";

import cookieSession from "cookie-session";
import express from "express";

import { env } from "@/config";
import { errorHandler, noRouteMatchHandler } from "@/lib/express_";

import { registerSwaggger } from "./docs";
import { cors } from "./middlewares";
import { registerRoutes } from "./routes";

const app = express();
app.use(cors);
app.use(express.json({ limit: env.JSON_MAX_SIZE * 1024 }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ keys: [env.SECRET_KEY] }));
registerRoutes(app);
registerSwaggger(app, "/docs");
app.use(noRouteMatchHandler);
app.use(errorHandler);

export default app;

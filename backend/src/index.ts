import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import "./controllers";

import { AppRouter, errorHandler } from "./framework";
import { wrongRoute, cors } from "./middlewares";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY!;
const app = express();
const router = AppRouter.getInstance();

app.use(cors);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
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

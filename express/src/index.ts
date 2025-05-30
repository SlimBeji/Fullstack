import mongoose from "mongoose";
import config from "./config";
import app from "./app";

// Connect Mongoose than run the app
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

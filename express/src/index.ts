import mongoose from "mongoose";
import { env } from "./config";
import app from "./api";

// Connect Mongoose than run the app
if (require.main === module) {
    mongoose
        .connect(env.MONGO_URL!, { dbName: env.MONGO_DBNAME })
        .then(() => {
            app.listen(env.PORT, () => {
                console.log(`Listening on port ${env.PORT}`);
            });
        })
        .catch(() => {
            console.log("Could not stablish connection to database");
        });
}

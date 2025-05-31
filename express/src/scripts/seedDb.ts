import mongoose from "mongoose";
import config from "../config";
import { seedDb } from "../models/examples";

if (require.main === module) {
    mongoose
        .connect(config.MONGO_URL)
        .then(() => seedDb())
        .then(() => console.log("Finished Creating database"))
        .finally(() => mongoose.disconnect());
}

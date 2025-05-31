import mongoose from "mongoose";
import config from "../config";
import { dumpDb } from "../models/examples";

if (require.main === module) {
    mongoose
        .connect(config.MONGO_URL)
        .then(() => dumpDb())
        .then(() => console.log("✅ All collections cleared successfully!"))
        .finally(() => mongoose.disconnect());
}

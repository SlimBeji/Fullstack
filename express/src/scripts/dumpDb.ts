import mongoose from "mongoose";
import { env } from "../config";
import { dumpDb } from "../models/examples";

if (require.main === module) {
    mongoose
        .connect(env.MONGO_URL)
        .then(() => dumpDb())
        .then(() => console.log("✅ All collections cleared successfully!"))
        .finally(() => mongoose.disconnect());
}

import mongoose from "mongoose";
import { env } from "../config";
import { seedDb } from "../models/examples";

if (require.main === module) {
    mongoose
        .connect(env.MONGO_URL)
        .then(() => seedDb())
        .then(() => console.log("Finished Creating database"))
        .finally(() => mongoose.disconnect());
}

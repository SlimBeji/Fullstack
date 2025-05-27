import mongoose from "mongoose";
import config from "../config";

mongoose
    .connect(config.MONGO_URL)
    .then(() => mongoose.connection.db!.collection("places").indexes())
    .then((indexes: any) => console.log(indexes))
    .finally(() => mongoose.disconnect());

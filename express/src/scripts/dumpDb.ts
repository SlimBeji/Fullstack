import mongoose from "mongoose";
import config from "../config";

const deleteCollections = async (): Promise<void> => {
    const collections = await mongoose.connection.db!.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
        console.log(`✅ Collection ${collection.namespace} cleared!`);
    }
};

mongoose
    .connect(config.MONGO_URL)
    .then(() => deleteCollections())
    .then(() => console.log("✅ All collections cleared successfully!"))
    .finally(() => mongoose.disconnect());

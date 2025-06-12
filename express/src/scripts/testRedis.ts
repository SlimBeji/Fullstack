import mongoose from "mongoose";
import { redisClient } from "../redisClient";
import { createToken } from "../api/auth";
import { crudUser } from "../models/crud";
import { env } from "../config";

async function test() {
    const user = await crudUser.getByEmail("mslimbeji@gmail.com");
    const encodedToken = await createToken(user!);
    console.log(encodedToken);
}

if (require.main === module) {
    mongoose
        .connect(env.MONGO_URL)
        .then(test)
        .then(() => redisClient.close())
        .finally(() => mongoose.disconnect());
}

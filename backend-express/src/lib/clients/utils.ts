import { redisClient } from "./cache";
import { db } from "./mongo";

export const connectDbs = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const closeDbs = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

import { db } from "./mongo";
import { redisClient } from "./cache";

export const connectDbs = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const closeDbs = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

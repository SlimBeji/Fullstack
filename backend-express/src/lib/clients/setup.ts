import { redisClient } from "./cache";
import { db } from "./mongo";

export const connectClients = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const closeClients = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

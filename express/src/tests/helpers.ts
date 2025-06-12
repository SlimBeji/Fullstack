import { redisClient, db } from "../lib/clients";

export const prepareMemoryDb = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const dropMemoryDb = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

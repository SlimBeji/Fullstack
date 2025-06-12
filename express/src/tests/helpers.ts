import { redisClient } from "../lib/clients";
import { memoryDb } from "./memoryDb";

export const prepareMemoryDb = async () => {
    await Promise.all([redisClient.connect(), memoryDb.session()]);
};

export const dropMemoryDb = async () => {
    await Promise.all([redisClient.close(), memoryDb.destroy()]);
};

import { env } from "@/config";
import { RedisClient, RedisClientConfig } from "@/lib/clients";
import { MongoClient, MongoClientConfig } from "@/lib/clients";

const redisConfig: RedisClientConfig = {
    url: env.REDIS_URL,
    testUrl: env.REDIS_TEST_URL,
};
export const redisClient = new RedisClient(redisConfig);

const mongoConfig: MongoClientConfig = {
    uri: env.MONGO_URL,
    dbName: env.MONGO_DBNAME,
    testDb: env.MONGO_TEST_DBNAME,
};
export const db = new MongoClient(mongoConfig);

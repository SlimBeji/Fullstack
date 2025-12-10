import { env } from "@/config";
import { RedisClient, RedisClientConfig } from "@/lib/clients";

const redisConfig: RedisClientConfig = {
    url: env.REDIS_URL,
    testUrl: env.REDIS_TEST_URL,
};
export const redisClient = new RedisClient(redisConfig);

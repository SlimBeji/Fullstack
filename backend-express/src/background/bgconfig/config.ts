import { env } from "@/config";
import { isTest } from "@/lib/utils";

export const broker_config = {
    connection: { url: isTest() ? env.REDIS_TEST_URL : env.REDIS_URL },
    defaultJobOptions: {
        removeOnComplete: {
            age: 7 * 24 * 60 * 60 * 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 60 * 60 * 1000,
        },
    },
};

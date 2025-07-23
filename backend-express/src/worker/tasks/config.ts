import { env } from "../../config";

export const config = {
    connection: { url: env.REDIS_URL },
    defaultJobOptions: {
        removeOnComplete: {
            age: 7 * 24 * 60 * 60 * 1000,
            count: 10000,
        },
        removeOnFail: {
            age: 30 * 24 * 60 * 60 * 1000,
            count: 5000,
        },
    },
};

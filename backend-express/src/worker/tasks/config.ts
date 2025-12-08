import { env } from "@/config";

export const config = {
    connection: { url: env.REDIS_URL },
    defaultJobOptions: {
        removeOnComplete: {
            age: 7 * 24 * 60 * 60 * 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 60 * 60 * 1000,
        },
    },
};

export enum Queues {
    EMAILS = "emails",
    AI = "ai",
}

export enum Tasks {
    NEWSLETTER = "newsletter",
    PLACE_EMBEDDING = "place_embedding",
}

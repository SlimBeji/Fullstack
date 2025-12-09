import { env } from "@/config";

// Broker setup

export const worker_config = {
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

// Queues

export enum Queues {
    EMAILS = "emails",
    AI = "ai",
}

// Tasks & Payload

export const TASK_PLACE_EMBEDDING = "place_embedding";

export interface PlaceEmbeddingData {
    placeId: string;
}

export const TASK_NEWSLETTER = "newsletter";

export interface NewsletterData {
    name: string;
    email: string;
}

export enum Queues {
    EMAILS = "emails",
    AI = "ai",
}

export type QueueType = (typeof Queues)[keyof typeof Queues];

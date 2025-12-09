import { Queue } from "bullmq";

import { ApiError, HttpStatus } from "@/lib/express";

import { broker_config, Queues, QueueType } from "../config";

export class TaskPublisher {
    private queues: Partial<Record<QueueType, Queue>> = {};

    public getQueue(name: QueueType): Queue {
        let queue = this.queues[name];
        if (!queue) {
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                `Queue ${name} was not registered`
            );
        }
        return queue;
    }

    public start(): void {
        Object.values(Queues).forEach((name) => {
            this.queues[name] = new Queue(name, broker_config);
        });
    }

    public async close(): Promise<void> {
        await Promise.all(
            Object.values(this.queues).map((queue) => queue.close())
        );
    }
}

export const publisher = new TaskPublisher();

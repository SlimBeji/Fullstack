import { Worker } from "bullmq";

import { broker_config, QueueType } from "../setup";
import { TASKS } from "./registery";

export class TaskHanlder {
    private workers: Partial<Record<QueueType, Worker>> = {};

    public start(): void {
        for (const [queue, router] of Object.entries(TASKS)) {
            const worker = new Worker(queue, router, broker_config);
            worker.on("failed", (job, err) => {
                console.error(
                    `Job ${job?.id} failed with error ${err.message}`
                );
            });
            this.workers[queue as QueueType] = worker;
        }
    }

    public async close(): Promise<void> {
        await Promise.all(
            Object.values(this.workers).map((worker) => worker.close())
        );
    }
}

export const handler = new TaskHanlder();

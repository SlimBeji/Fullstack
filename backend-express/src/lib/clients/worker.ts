import { Job, Queue, QueueOptions, Worker, WorkerOptions } from "bullmq";

import { ApiError, HttpStatus } from "@/lib/express_";

// Publisher

export class TaskPublisher {
    private queues: Partial<Record<string, Queue>> = {};

    constructor(
        private names: string[],
        private options: QueueOptions
    ) {}

    public getQueue(name: string): Queue {
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
        this.names.forEach((name) => {
            this.queues[name] = new Queue(name, this.options);
        });
    }

    public async close(): Promise<void> {
        await Promise.all(
            Object.values(this.queues).map((queue) => {
                if (queue) {
                    queue.close();
                }
            })
        );
    }
}

// Handler

export type TaskRegistery = Record<string, (job: Job) => Promise<void>>;

export class TaskHanlder {
    private workers: Partial<Record<string, Worker>> = {};

    constructor(
        private tasks: TaskRegistery,
        private options: WorkerOptions
    ) {}

    public start(): void {
        for (const [queue, router] of Object.entries(this.tasks)) {
            const worker = new Worker(queue, router, this.options);
            worker.on("failed", (job, err) => {
                console.error(
                    `Job ${job?.id} failed with error ${err.message}`
                );
            });
            this.workers[queue] = worker;
        }
    }

    public async close(): Promise<void> {
        await Promise.all(
            Object.values(this.workers).map((worker) => {
                if (worker) {
                    worker.close();
                }
            })
        );
    }
}

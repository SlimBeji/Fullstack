import { Job, Worker, WorkerOptions } from "bullmq";

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

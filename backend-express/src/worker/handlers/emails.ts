import { Job, Worker } from "bullmq";

import {
    NewsletterData,
    Queues,
    TASK_NEWSLETTER,
    worker_config,
} from "../config";

// Create Tasks

async function sendNewsletterTask(job: Job<NewsletterData>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const { name, email } = job.data;
    console.log(
        `Newsletter Email sent to ${name} at following address: ${email}`
    );
}

// Tasks Router
type emailTaskData = NewsletterData;

async function emailTasksProcessor(job: Job<emailTaskData>): Promise<void> {
    switch (job.name) {
        case TASK_NEWSLETTER:
            await sendNewsletterTask(job);
            break;
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
}

// Start Worker
export const emailWorker = new Worker(
    Queues.EMAILS,
    emailTasksProcessor,
    worker_config
);
emailWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

import { Job, Queue, Worker } from "bullmq";

import { Queues, Tasks } from "../../types";
import { config } from "./config";

// Define Queue
const emailQueue = new Queue(Queues.EMAILS, config);

// Define Tasks, Types and Callers
interface NewsletterData {
    name: string;
    email: string;
}

async function sendNewsletterTask(job: Job<NewsletterData>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const { name, email } = job.data;
    console.log(
        `Newsletter Email sent to ${name} at following address: ${email}`
    );
}

export const sendNewsletter = (name: string, email: string) => {
    if (process.env.JEST_WORKER_ID) return;
    emailQueue.add(Tasks.NEWSLETTER, { name, email });
};

// Worker
type emailTaskData = NewsletterData;

async function emailTasksProcessor(job: Job<emailTaskData>): Promise<void> {
    switch (job.name) {
        case Tasks.NEWSLETTER:
            await sendNewsletterTask(job);
            break;
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
}

const emailWorker = new Worker(Queues.EMAILS, emailTasksProcessor, config);
emailWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

// Cleaner
export const closeAiWorker = async () => {
    await emailQueue.close();
    await emailWorker.close();
};

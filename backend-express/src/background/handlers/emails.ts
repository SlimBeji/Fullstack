import { Job } from "bullmq";

import { NewsletterData, TASK_NEWSLETTER } from "../setup";

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

export async function emailTasksRouter(job: Job<emailTaskData>): Promise<void> {
    switch (job.name) {
        case TASK_NEWSLETTER:
            await sendNewsletterTask(job);
            break;
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
}

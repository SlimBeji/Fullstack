import { Job, Worker } from "bullmq";
import { Tasks, Queues } from "../../types";
import { emailQueue, config } from "./config";

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

const emailWorker = new Worker(Queues.EMAILS, sendNewsletterTask, config);
emailWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

export const sendNewsletter = (name: string, email: string) => {
    emailQueue.add(Tasks.NEWSLETTER, { name, email });
};

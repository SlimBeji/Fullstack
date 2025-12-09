import { Queue } from "bullmq";

import { Queues, TASK_NEWSLETTER, worker_config } from "../config";

export const emailQueue = new Queue(Queues.EMAILS, worker_config);

export const sendNewsletter = (name: string, email: string) => {
    if (process.env.JEST_WORKER_ID) return;
    emailQueue.add(TASK_NEWSLETTER, { name, email });
};

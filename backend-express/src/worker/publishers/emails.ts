import { Queue } from "bullmq";

import { broker_config, Queues, TASK_NEWSLETTER } from "../config";

export const emailQueue = new Queue(Queues.EMAILS, broker_config);

export const sendNewsletter = (name: string, email: string) => {
    if (process.env.JEST_WORKER_ID) return;
    emailQueue.add(TASK_NEWSLETTER, { name, email });
};

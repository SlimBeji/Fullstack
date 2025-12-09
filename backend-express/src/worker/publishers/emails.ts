import { Queues, TASK_NEWSLETTER } from "../config";
import { publisher } from "./publisher";

export const sendNewsletter = (name: string, email: string) => {
    if (process.env.JEST_WORKER_ID) return;
    let queue = publisher.getQueue(Queues.EMAILS);
    queue.add(TASK_NEWSLETTER, { name, email });
};

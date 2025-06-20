import { Queue } from "bullmq";
import { env } from "../../config";
import { Queues } from "../../types";

export const config = {
    connection: { url: env.REDIS_URL },
};

export const emailQueue = new Queue(Queues.EMAILS, config);

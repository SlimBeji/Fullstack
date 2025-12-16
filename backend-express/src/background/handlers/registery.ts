import { Job } from "bullmq";

import { Queues, QueueType } from "../setup";
import { aiTasksRouter } from "./ai";
import { emailTasksRouter } from "./emails";

export const TASKS: Record<QueueType, (job: Job) => Promise<void>> = {
    [Queues.AI]: aiTasksRouter,
    [Queues.EMAILS]: emailTasksRouter,
};

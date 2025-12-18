import { Job } from "bullmq";

import { TaskHanlder } from "@/lib/clients";

import { broker_config, Queues, QueueType } from "../setup";
import { aiTasksRouter } from "./ai";
import { emailTasksRouter } from "./emails";

export const TASKS: Record<QueueType, (job: Job) => Promise<void>> = {
    [Queues.AI]: aiTasksRouter,
    [Queues.EMAILS]: emailTasksRouter,
};

export const handler = new TaskHanlder(TASKS, broker_config);

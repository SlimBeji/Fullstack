import { Queue } from "bullmq";

import { broker_config, Queues, TASK_PLACE_EMBEDDING } from "../config";

export const aiQueue = new Queue(Queues.AI, broker_config);

export const placeEmbedding = (placeId: string) => {
    if (process.env.JEST_WORKER_ID) return;
    aiQueue.add(TASK_PLACE_EMBEDDING, { placeId });
};

import { Queue } from "bullmq";

import { Queues, TASK_PLACE_EMBEDDING, worker_config } from "../config";

export const aiQueue = new Queue(Queues.AI, worker_config);

export const placeEmbedding = (placeId: string) => {
    if (process.env.JEST_WORKER_ID) return;
    aiQueue.add(TASK_PLACE_EMBEDDING, { placeId });
};

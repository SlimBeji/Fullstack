import { Queues, TASK_PLACE_EMBEDDING } from "../setup";
import { publisher } from "./publisher";

export const placeEmbedding = (placeId: number) => {
    if (process.env.JEST_WORKER_ID) return;
    let queue = publisher.getQueue(Queues.AI);
    queue.add(TASK_PLACE_EMBEDDING, { placeId });
};

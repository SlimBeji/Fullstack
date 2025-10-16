import { Job, Queue, Worker } from "bullmq";

import { huggingFace } from "@/lib/clients/huggingFace";
import { crudPlace } from "@/models/crud";
import { Queues, Tasks } from "@/types";

import { config } from "./config";

// Define Queue
const aiQueue = new Queue(Queues.AI, config);

// Embedding Text
interface PlaceEmbeddingData {
    placeId: string;
}

async function placeEmbeddingTask(job: Job<PlaceEmbeddingData>): Promise<void> {
    const { placeId } = job.data;
    const place = await crudPlace.getDocument(placeId);
    if (!place) {
        console.log(`No place with id ${placeId} found in the database`);
        return;
    }
    const text = `${place.title} - ${place.description}`;
    const result = await huggingFace.embedText(text);
    place.set({ embedding: result });
    crudPlace.saveDocument(place);
    console.log(result);
}

export const placeEmbedding = (placeId: string) => {
    if (process.env.JEST_WORKER_ID) return;
    aiQueue.add(Tasks.PLACE_EMBEDDING, { placeId });
};

// Worker
type AiTasksData = PlaceEmbeddingData;

async function aiTasksProcessor(job: Job<AiTasksData>) {
    switch (job.name) {
        case Tasks.PLACE_EMBEDDING:
            await placeEmbeddingTask(job);
            break;
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
}

const aiWorker = new Worker(Queues.AI, aiTasksProcessor, config);
aiWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

// Cleaner
export const closeEmailWorker = async () => {
    await aiQueue.close();
    await aiWorker.close();
};

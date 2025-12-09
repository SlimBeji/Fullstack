import { Job, Worker } from "bullmq";

import { huggingFace } from "@/lib/clients";
import { crudPlace } from "@/models/crud";

import {
    broker_config,
    PlaceEmbeddingData,
    Queues,
    TASK_PLACE_EMBEDDING,
} from "../config";

// Create Tasks

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

// Tasks Router
type AiTasksData = PlaceEmbeddingData;

async function aiTasksRouter(job: Job<AiTasksData>) {
    switch (job.name) {
        case TASK_PLACE_EMBEDDING:
            await placeEmbeddingTask(job);
            break;
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
}

// Start Worker
export const aiWorker = new Worker(Queues.AI, aiTasksRouter, broker_config);
aiWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

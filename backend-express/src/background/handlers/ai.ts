import { Job } from "bullmq";

import { crudsPlace } from "@/models/cruds";

import { PlaceEmbeddingData, TASK_PLACE_EMBEDDING } from "../bgconfig";

// Create Tasks

async function placeEmbeddingTask(job: Job<PlaceEmbeddingData>): Promise<void> {
    const { placeId } = job.data;
    const result = await crudsPlace.embed(placeId);
    console.log(result);
}

// Tasks Router
type AiTasksData = PlaceEmbeddingData;

export async function aiTasksRouter(job: Job<AiTasksData>) {
    switch (job.name) {
        case TASK_PLACE_EMBEDDING:
            await placeEmbeddingTask(job);
            break;
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
}

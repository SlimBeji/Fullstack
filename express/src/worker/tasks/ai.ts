import { Job, Worker, Queue } from "bullmq";
import { Tasks, Queues } from "../../types";
import { config } from "./config";

// Define Queue
const aiQueue = new Queue(Queues.AI, config);

// Captionning Task
interface CaptionningData {
    file: File;
}

async function captionningTask(job: Job<CaptionningData>): Promise<void> {
    const { file } = job.data;
    console.log(`Generating caption for file ${file.name}`);
}

export const captionImage = (file: File) => {
    aiQueue.add(Tasks.CAPTIONNING, { file });
};

// Embedding Text
interface EmbeddingData {
    text: string;
}

async function embeddingTask(job: Job<EmbeddingData>): Promise<void> {
    const { text } = job.data;
    console.log(`Generating embedding for text: ${text}`);
}

export const embedding = (text: string) => {
    aiQueue.add(Tasks.EMBEDDING, { text });
};

// Worker
type AiTasksData = CaptionningData | EmbeddingData;

async function aiTasksProcessor(job: Job<AiTasksData>) {
    switch (job.name) {
        case Tasks.CAPTIONNING:
            await captionningTask(job as Job<CaptionningData>);
            break;
        case Tasks.EMBEDDING:
            await embeddingTask(job as Job<EmbeddingData>);
            break;
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
}

const aiWorker = new Worker(Queues.AI, aiTasksProcessor, config);
aiWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

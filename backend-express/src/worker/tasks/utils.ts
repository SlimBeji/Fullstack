import { closeEmailWorker } from "./ai";
import { closeAiWorker } from "./email";

export const closeWorkers = async () => {
    await closeEmailWorker();
    await closeAiWorker();
};

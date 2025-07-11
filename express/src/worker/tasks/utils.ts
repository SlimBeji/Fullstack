import { cleanEmailWorker } from "./ai";
import { cleanAiWorker } from "./email";

export const cleanWorker = async () => {
    await cleanEmailWorker();
    await cleanAiWorker();
};

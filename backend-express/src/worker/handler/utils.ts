import { aiWorker } from "./ai";
import { emailWorker } from "./emails";

export const closeWorkers = async () => {
    await Promise.all([aiWorker.close(), emailWorker.close()]);
};

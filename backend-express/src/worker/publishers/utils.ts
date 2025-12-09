import { aiQueue } from "./ai";
import { emailQueue } from "./emails";

export const closeQueues = async () => {
    Promise.all([aiQueue.close(), emailQueue.close()]);
};

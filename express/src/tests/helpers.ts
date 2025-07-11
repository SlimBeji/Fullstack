import { closeDbs } from "../lib/clients";
import { cleanCron } from "../worker/crons";
import { cleanWorker } from "../worker/tasks";

export const cleanAfterTest = async () => {
    await cleanWorker();
    await cleanCron();
    await closeDbs();
};

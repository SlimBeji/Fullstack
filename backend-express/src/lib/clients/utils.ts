import { db } from "./mongo";
import { redisClient } from "./cache";
import { closeCrons } from "../../worker/crons";
import { closeWorkers } from "../../worker/tasks";

export const connectDbs = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const closeDbs = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

export const closeAll = async () => {
    await closeWorkers();
    await closeCrons();
    await closeDbs();
};

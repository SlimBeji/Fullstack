import { closeCrons } from "../../worker/crons";
import { closeWorkers } from "../../worker/tasks";
import { redisClient } from "./cache";
import { db } from "./mongo";

export const connectDbs = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const closeDbs = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

export const closeAll = async () => {
    await closeDbs();
    await closeWorkers();
    await closeCrons();
};

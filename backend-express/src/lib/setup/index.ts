import { dumpDb, seedDb } from "@/models/examples";
import { closeCrons } from "@/worker/crons";

import { db, redisClient } from "../clients";

export const connectDbs = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const closeDbs = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

export const startAll = async () => {
    await connectDbs();
};

export const closeAll = async () => {
    await closeDbs();
    await closeCrons();
};

export const seedTestData = async () => {
    await connectDbs();
    await dumpDb();
    await seedDb();
};

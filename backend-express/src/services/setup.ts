import { scheduler } from "@/background/crons";
import { handler } from "@/background/handlers";
import { publisher } from "@/background/publishers";
import { dumpDb, seedDb } from "@/models/examples";

import { db, redisClient } from "./services";

export const connectDbs = async () => {
    await Promise.all([redisClient.connect(), db.connect()]);
};

export const closeDbs = async () => {
    await Promise.all([redisClient.close(), db.close()]);
};

export const startBackgroundProcessing = async () => {
    await Promise.all([scheduler.start(), publisher.start(), handler.start()]);
};

export const stopBackgroundProcessing = async () => {
    await Promise.all([scheduler.close(), publisher.close(), handler.close()]);
};

export const startAll = async () => {
    await connectDbs();
    await startBackgroundProcessing();
};

export const closeAll = async () => {
    await closeDbs();
    await stopBackgroundProcessing();
};

export const seedTestData = async () => {
    await connectDbs();
    await dumpDb();
    await seedDb();
};

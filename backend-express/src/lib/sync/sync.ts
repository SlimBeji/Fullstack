import { dumpDb, seedDb } from "../../models/examples";
import { closeCrons } from "../../worker/crons";
import { closeWorkers } from "../../worker/tasks";
import { closeDbs, connectDbs } from "../clients";

export const startAll = async () => {
    await connectDbs();
};

export const closeAll = async () => {
    await closeDbs();
    await closeWorkers();
    await closeCrons();
};

export const seedTestData = async () => {
    await connectDbs();
    await dumpDb();
    await seedDb();
};

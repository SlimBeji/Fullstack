import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { seedDb } from "../scripts/seedDb";
import config from "../config";

class MemoryDb {
    private replSet: MongoMemoryReplSet | null;
    public uri: string = "";
    constructor() {
        this.replSet = null;
    }
    public async start(seed: boolean = true): Promise<void> {
        this.replSet = await MongoMemoryReplSet.create({
            replSet: { count: 2 },
            instanceOpts: [
                { storageEngine: "wiredTiger" },
                { storageEngine: "wiredTiger" },
            ],
        });
        this.uri = this.replSet.getUri();
        await mongoose.connect(this.uri, { dbName: config.MONGO_DBNAME });

        // Seed the database after starting
        if (seed) {
            await seedDb();
        }
    }
    public async stop(): Promise<void> {
        await mongoose.disconnect();
        if (this.replSet) await this.replSet.stop();
        this.replSet = null;
        this.uri = "";
    }
}

export const memoryDb = new MemoryDb();

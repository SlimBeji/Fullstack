import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { seedDb } from "../models/examples";

export class MemoryDb {
    private replSet: MongoMemoryReplSet | null = null;
    public uri: string = "";

    private async create(): Promise<void> {
        if (!this.replSet) {
            this.replSet = await MongoMemoryReplSet.create({
                replSet: { count: 1 },
                instanceOpts: [{ storageEngine: "wiredTiger" }],
            });
            this.uri = this.replSet.getUri();
        }
    }

    public async session(dbName: string = "main"): Promise<void> {
        await this.create();
        const conn = await mongoose.connect(this.uri, { dbName });
        const wasSeeded = await conn.connection
            .db!.listCollections({ name: "users" })
            .hasNext();
        if (!wasSeeded) {
            await seedDb();
        }
    }

    public async disconnect(): Promise<void> {
        await mongoose.disconnect();
    }

    public async destroy(): Promise<void> {
        await mongoose.disconnect();
        if (this.replSet) await this.replSet.stop();
        this.replSet = null;
        this.uri = "";
    }
}

export const memoryDb = new MemoryDb();

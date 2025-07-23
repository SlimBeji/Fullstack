import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose, { Mongoose } from "mongoose";

import { env } from "../../config";
import { seedDb } from "../../models/examples";
import { CollectionEnum } from "../../types";

export class MongoClient {
    private conn: Mongoose | null = null;
    private replSetMock: MongoMemoryReplSet | null = null;
    public uri: string = "";
    public dbName: string = "";

    public get isTest(): boolean {
        return !!process.env.JEST_WORKER_ID;
    }

    constructor() {
        if (!this.isTest) {
            this.uri = env.MONGO_URL;
        }
        this.dbName = env.MONGO_DBNAME;
    }

    private async prepareMock(): Promise<void> {
        if (!this.replSetMock) {
            this.replSetMock = await MongoMemoryReplSet.create({
                replSet: { count: 1 },
                instanceOpts: [{ storageEngine: "wiredTiger" }],
            });
            this.uri = this.replSetMock.getUri();
        }
    }

    private async seedMock(): Promise<void> {
        if (!this.conn) {
            throw new Error(
                "Cannot seed while the connection is not established"
            );
        }
        const wasSeeded = await this.conn.connection
            .db!.listCollections({ name: CollectionEnum.USERS })
            .hasNext();

        if (!wasSeeded) {
            await seedDb();
        }
    }

    public async connect(): Promise<void> {
        if (this.isTest) {
            await this.prepareMock();
        }
        this.conn = await mongoose.connect(this.uri, { dbName: this.dbName });
        if (this.isTest) {
            await this.seedMock();
        }
    }

    public async close(): Promise<void> {
        await mongoose.disconnect();
        if (this.isTest && !!this.replSetMock) {
            await this.replSetMock.stop();
            this.replSetMock = null;
            this.uri = "";
        }
    }
}

export const db = new MongoClient();

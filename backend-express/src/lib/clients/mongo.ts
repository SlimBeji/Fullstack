import mongoose, { Mongoose } from "mongoose";

import { env } from "@/config";

export class MongoClient {
    public conn: Mongoose | null = null;
    public uri: string = env.MONGO_URL;

    public get isTest(): boolean {
        return !!process.env.JEST_WORKER_ID;
    }

    public get dbName(): string {
        if (this.isTest) {
            return env.MONGO_TEST_DBNAME;
        }
        return env.MONGO_DBNAME;
    }

    public async connect(): Promise<void> {
        this.conn = await mongoose.connect(this.uri, { dbName: this.dbName });
    }

    public async close(): Promise<void> {
        await mongoose.disconnect();
    }

    public async createCollection(name: string): Promise<void> {
        await mongoose.connection.db!.createCollection(name);
    }

    public async listCollections(): Promise<mongoose.mongo.CollectionInfo[]> {
        return await mongoose.connection.db!.listCollections().toArray();
    }

    public async dropCollection(name: string): Promise<void> {
        await mongoose.connection.db!.dropCollection(name);
    }
}

export const db = new MongoClient();

import mongoose from "mongoose";

export interface MongoClientConfig {
    uri: string;
    dbName?: string;
    testDb?: string;
}

export class MongoClient {
    public readonly uri: string;
    public readonly dbName: string;

    constructor(config: MongoClientConfig) {
        this.uri = config.uri;
        if (this.isTest) {
            if (!config.testDb) {
                throw new Error(
                    "Cannot run mongo client in test mode. No testing db name provided"
                );
            }
            this.dbName = config.testDb;
        } else {
            if (!config.dbName) {
                throw new Error(
                    "Cannot run mongo client in production mode. No production db name provided"
                );
            }
            this.dbName = config.dbName;
        }
    }

    public get isTest(): boolean {
        return !!process.env.JEST_WORKER_ID;
    }

    public async connect(): Promise<void> {
        await mongoose.connect(this.uri, { dbName: this.dbName });
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

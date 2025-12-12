import mongoose from "mongoose";

export interface MongoClientConfig {
    uri: string;
    dbName: string;
}

export class MongoClient {
    public readonly uri: string;
    public readonly dbName: string;

    constructor(config: MongoClientConfig) {
        if (!config.dbName || !config.uri) {
            throw new Error(
                "A valid uri and dbName must be provided to the mongo client"
            );
        }
        this.uri = config.uri;
        this.dbName = config.dbName;
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

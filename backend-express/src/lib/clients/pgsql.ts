import { DataSource } from "typeorm";

export interface PgClientConfig {
    uri: string;
    entities: string[];
}

export class PgClient {
    public readonly uri: string;
    public readonly client: DataSource;

    constructor(config: PgClientConfig) {
        if (!config.uri) {
            throw new Error("A valid uri must be provided to the pgsql client");
        }
        this.uri = config.uri;
        this.client = new DataSource({
            type: "postgres",
            url: this.uri,
            entities: config.entities,
            synchronize: false,
        });
    }

    public async connect(): Promise<void> {
        await this.client.initialize();
    }

    public async close(): Promise<void> {
        await this.client.destroy();
    }

    public async listTables(): Promise<string[]> {
        const tables = await this.client.query(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'migrations'`
        );
        return tables.map((row: { tablename: string }) => row.tablename);
    }

    public async resetTable(table: string): Promise<void> {
        // private method for development and unit tests
        // no sql injection risk!
        await this.client.query(
            `TRUNCATE TABLE "public"."${table}" RESTART IDENTITY CASCADE`
        );
    }
}

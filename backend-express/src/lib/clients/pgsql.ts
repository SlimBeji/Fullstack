import { PrismaPg } from "@prisma/adapter-pg";

// generated with npx prisma generate
import { PrismaClient } from "@/_generated/prisma/client";

export interface PgClientConfig {
    uri: string;
}

export class PgClient {
    public readonly uri: String;
    private readonly adapter: PrismaPg;
    public readonly client: PrismaClient;

    constructor(config: PgClientConfig) {
        if (!config.uri) {
            throw new Error("A valid uri must be provided to the pgsql client");
        }
        this.uri = config.uri;
        this.adapter = new PrismaPg({ connectionString: this.uri });
        this.client = new PrismaClient({ adapter: this.adapter });
    }

    public async connect(): Promise<void> {
        await this.client.$connect();
    }

    public async close(): Promise<void> {
        await this.client.$disconnect();
    }
}

// Need methods to drop tables and recreate

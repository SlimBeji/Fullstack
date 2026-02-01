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

    public async listTables(): Promise<string[]> {
        const tables = await this.client.$queryRaw<
            Array<{ tablename: string }>
        >`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`;
        return tables.map((row) => row.tablename);
    }

    public async resetTables(): Promise<void> {
        const tables = await this.listTables();
        if (tables.length == 0) return;

        const tableNames = tables.map((t) => `"public"."${t}"`).join(", ");
        await this.client.$executeRawUnsafe(
            `TRUNCATE TABLE ${tableNames} CASCADE RESTART IDENTITY`
        );
    }
}

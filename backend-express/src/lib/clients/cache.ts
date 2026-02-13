import { createClient, RedisClientType } from "redis";

import { ApiError, HttpStatus } from "@/lib/express_";

export interface RedisClientConfig {
    url: string;
    expiration?: number;
    persist?: boolean;
}

export class RedisClient {
    private readonly client: RedisClientType;
    readonly url: string;
    readonly defaultExpiration: number;

    constructor(config: RedisClientConfig) {
        if (!config.url) {
            throw new Error("A valid redis url must be provided");
        }
        this.url = config.url;
        this.defaultExpiration = config.expiration || 3600;
        this.client = createClient({ url: this.url });

        if (!config.persist) {
            this.client.on("connect", async () => {
                try {
                    await this.client.configSet(
                        "stop-writes-on-bgsave-error",
                        "no"
                    );
                    await this.client.configSet("save", "");
                    await this.client.configSet("appendonly", "no");
                } catch (error) {
                    console.warn("Failed to disable Redis persistence:", error);
                }
            });
        }
    }

    private get isReady(): boolean {
        return this.client.isReady;
    }

    async connect(): Promise<void> {
        if (!this.isReady) {
            try {
                await this.client.connect();
            } catch (error) {
                console.error("Failed to connect to Redis:", error);
            }
        }
    }

    async flushAll(): Promise<void> {
        await this.client.flushAll();
    }

    async close(): Promise<void> {
        if (this.isReady) {
            await this.client.quit();
        }
    }

    async get(key: string): Promise<any> {
        await this.connect();
        const stored = await this.client.get(key);
        if (!stored) {
            return null;
        }
        return JSON.parse(stored);
    }

    async set(
        key: string,
        val: any,
        expiration: number | null = null
    ): Promise<any> {
        let stringified;
        expiration = expiration || this.defaultExpiration;
        try {
            stringified = JSON.stringify(val);
        } catch {
            throw new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                `Could not store value ${val} in redis`
            );
        }
        await this.connect();
        await this.client.set(key, stringified, {
            EX: expiration,
        });
        return stringified;
    }

    async delete(key: string): Promise<void> {
        await this.connect();
        await this.client.del([key]);
    }
}

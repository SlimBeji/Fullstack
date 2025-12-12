import { createClient, RedisClientType } from "redis";

import { ApiError, HttpStatus } from "@/lib/express";

export interface RedisClientConfig {
    url: string;
    expiration?: number;
}

export class RedisClient {
    private readonly client: RedisClientType;
    public readonly url: string;
    public readonly defaultExpiration: number;

    constructor(config: RedisClientConfig) {
        if (!config.url) {
            throw new Error("A valid redis url must be provided");
        }
        this.url = config.url;
        this.defaultExpiration = config.expiration || 3600;
        this.client = createClient({ url: this.url });
    }

    private get isReady(): boolean {
        return this.client.isReady;
    }

    public async connect(): Promise<void> {
        if (!this.isReady) {
            try {
                await this.client.connect();
            } catch (error) {
                console.error("Failed to connect to Redis:", error);
            }
        }
    }

    public async flushAll(): Promise<void> {
        await this.client.flushAll();
    }

    public async close(): Promise<void> {
        if (this.isReady) {
            await this.client.quit();
        }
    }

    public async get(key: string): Promise<any> {
        await this.connect();
        const stored = await this.client.get(key);
        if (!stored) {
            return null;
        }
        return JSON.parse(stored);
    }

    public async set(
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

    public async delete(key: string): Promise<void> {
        await this.connect();
        await this.client.del([key]);
    }
}

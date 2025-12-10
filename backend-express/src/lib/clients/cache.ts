import { createClient, RedisClientType } from "redis";

import { env } from "@/config";
import { ApiError, HttpStatus } from "@/lib/express";

export interface RedisClientConfig {
    url?: string;
    testUrl?: string;
}

export class RedisClient {
    private readonly client: RedisClientType;
    public readonly url: string;

    constructor(config: RedisClientConfig) {
        if (this.isTest) {
            if (!config.testUrl) {
                throw new Error(
                    "Cannot run redis client in test mode. No testing url provided"
                );
            }
            this.url = config.testUrl;
        } else {
            if (!config.url) {
                throw new Error(
                    "Cannot run redis client in production mode. No production url provided"
                );
            }
            this.url = config.url;
        }
        this.client = createClient({ url: this.url });
    }

    public get isTest(): boolean {
        return !!process.env.JEST_WORKER_ID;
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
        expiration = expiration || env.REDIS_DEFAULT_EXPIRATION;
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

import { createClient, RedisClientType } from "redis";

import { env } from "@/config";
import { ApiError, HttpStatus } from "@/types";

export class RedisClient {
    private client: RedisClientType;

    public get isTest(): boolean {
        return !!process.env.JEST_WORKER_ID;
    }

    public get url(): string {
        if (this.isTest) {
            return env.REDIS_TEST_URL;
        }
        return env.REDIS_URL;
    }

    private get isReady(): boolean {
        return this.client.isReady;
    }

    constructor() {
        this.client = createClient({ url: this.url });
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

    public wrap<I extends any[], O>(
        fn: ((...inputs: I) => O) | ((...inputs: I) => Promise<O>),
        keygen: (...inputs: I) => string,
        expiration: number | null = null
    ): (...inputs: I) => Promise<O> {
        return async (...inputs: I): Promise<O> => {
            const key = keygen(...inputs);
            const stored = (await this.get(key)) as O;
            if (stored) return stored;
            const result = fn(...inputs);
            const finalResult = await Promise.resolve(result);
            await this.set(key, finalResult, expiration);
            return finalResult;
        };
    }
}

export const redisClient = new RedisClient();

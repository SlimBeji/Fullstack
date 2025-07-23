import IORedisMock from "ioredis-mock";
import { createClient, RedisClientType } from "redis";

import { env } from "../../config";
import { ApiError, HttpStatus } from "../../types";

export class RedisClient {
    private client: RedisClientType | InstanceType<typeof IORedisMock>;

    public get isTest(): boolean {
        return !!process.env.JEST_WORKER_ID;
    }

    private get isReady(): boolean {
        if (this.isTest) return true;
        return (this.client as RedisClientType).isReady;
    }

    constructor() {
        if (this.isTest) {
            this.client = new IORedisMock();
        } else {
            this.client = createClient({
                url: env.REDIS_URL,
            });
        }
    }

    public async connect(): Promise<void> {
        if (!this.isReady && !this.isTest) {
            try {
                await this.client.connect();
            } catch (error) {
                console.error("Failed to connect to Redis:", error);
            }
        }
    }

    public async flushAll(): Promise<void> {
        if (this.isTest) {
            await (this.client as InstanceType<typeof IORedisMock>).flushall();
        } else {
            await (this.client as RedisClientType).flushAll();
        }
    }

    public async close(): Promise<void> {
        if (this.isReady && !this.isTest) {
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
        if (this.isTest) {
            await (this.client as InstanceType<typeof IORedisMock>).set(
                key,
                stringified,
                "EX",
                expiration
            );
        } else {
            await (this.client as RedisClientType).set(key, stringified, {
                EX: expiration,
            });
        }

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

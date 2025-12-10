import { env } from "@/config";
import {
    CloudStorage,
    CloudStorageConfig,
    MongoClient,
    MongoClientConfig,
    RedisClient,
    RedisClientConfig,
} from "@/lib/clients";

const mongoConfig: MongoClientConfig = {
    uri: env.MONGO_URL,
    dbName: env.MONGO_DBNAME,
    testDb: env.MONGO_TEST_DBNAME,
};
export const db = new MongoClient(mongoConfig);

const redisConfig: RedisClientConfig = {
    url: env.REDIS_URL,
    testUrl: env.REDIS_TEST_URL,
};
export const redisClient = new RedisClient(redisConfig);

const storageConfig: CloudStorageConfig = {
    projectId: env.GCP_PROJECT_ID,
    bucketName: env.GCS_BUCKET_NAME,
    accessExpiration: env.GCS_BLOB_ACCESS_EXPIRATION,
    credentialsFile: env.GOOGLE_APPLICATION_CREDENTIALS,
    emulatorPublicUrl: env.GCS_EMULATOR_PUBLIC_URL,
    emulatorPrivateUrl: env.GCS_EMULATOR_PRIVATE_URL,
};
export const storage = new CloudStorage(storageConfig);

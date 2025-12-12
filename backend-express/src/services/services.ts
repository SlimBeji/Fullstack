import { env } from "@/config";
import {
    CloudStorage,
    CloudStorageConfig,
    HuggingFaceClient,
    HuggingFaceClientConfig,
    MongoClient,
    MongoClientConfig,
    RedisClient,
    RedisClientConfig,
} from "@/lib/clients";

const IS_TEST = !!process.env.JEST_WORKER_ID;

const mongoConfig: MongoClientConfig = {
    uri: env.MONGO_URL,
    dbName: IS_TEST ? env.MONGO_TEST_DBNAME : env.MONGO_DBNAME,
};
export const db = new MongoClient(mongoConfig);

const redisConfig: RedisClientConfig = {
    url: IS_TEST ? env.REDIS_TEST_URL : env.REDIS_URL,
    expiration: env.REDIS_DEFAULT_EXPIRATION,
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

const huggingfaceConfig: HuggingFaceClientConfig = {
    token: env.HF_API_TOKEN,
};
export const huggingFace = new HuggingFaceClient(huggingfaceConfig);

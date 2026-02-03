import dotenv from "dotenv";

import { getEnvVar } from "@/lib/utils";

dotenv.config();

export const env = {
    // ENV config
    PORT: getEnvVar("PORT", "5000"),
    API_URL: getEnvVar("API_URL", "http://localhost:5000/api"),
    APP_URL: getEnvVar("APP_URL"),
    SECRET_KEY: getEnvVar("SECRET_KEY"),
    DEFAULT_HASH_SALT: Number(getEnvVar("DEFAULT_HASH_SALT", "12")),
    FILEUPLOAD_MAX_SIZE: Number(getEnvVar("FILEUPLOAD_MAX_SIZE", "100")),
    JSON_MAX_SIZE: Number(getEnvVar("JSON_MAX_SIZE", "10240")),
    MAX_ITEMS_PER_PAGE: Number(getEnvVar("MAX_ITEMS_PER_PAGE", "100")),
    GOD_MODE_LOGIN: getEnvVar("GOD_MODE_LOGIN"),
    JWT_EXPIRATION: Number(getEnvVar("JWT_EXPIRATION", "3600")),
    DEFAULT_TIMEOUT: Number(getEnvVar("DEFAULT_TIMEOUT", "20")),
    ENV: getEnvVar("ENV"),

    // DATABASE config
    DATABASE_URL: getEnvVar("DATABASE_URL"),
    DATABASE_TEST_URL: getEnvVar("DATABASE_TEST_URL"),
    REDIS_URL: getEnvVar("REDIS_URL"),
    REDIS_TEST_URL: getEnvVar("REDIS_TEST_URL", ""),
    REDIS_DEFAULT_EXPIRATION: Number(
        getEnvVar("REDIS_DEFAULT_EXPIRATION", "3600")
    ),

    // HUGGING FACE config
    HF_API_TOKEN: getEnvVar("HF_API_TOKEN"),

    // GCP config
    GOOGLE_APPLICATION_CREDENTIALS: getEnvVar(
        "GOOGLE_APPLICATION_CREDENTIALS",
        ""
    ),
    GCP_PROJECT_ID: getEnvVar("GCP_PROJECT_ID"),
    GCS_BUCKET_NAME: getEnvVar("GCS_BUCKET_NAME"),
    GCS_BLOB_ACCESS_EXPIRATION: Number(
        getEnvVar("GCS_BLOB_ACCESS_EXPIRATION", "3600")
    ),
    GCS_EMULATOR_PRIVATE_URL: getEnvVar("GCS_EMULATOR_PRIVATE_URL", ""),
    GCS_EMULATOR_PUBLIC_URL: getEnvVar("GCS_EMULATOR_PUBLIC_URL", ""),
};

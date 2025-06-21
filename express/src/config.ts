import dotenv from "dotenv";

dotenv.config();

// Checker
const parseVar = (varname: string, defaultValue?: string): string => {
    const value = process.env[varname] || defaultValue;
    if (!value && defaultValue === undefined) {
        throw new Error(`${varname} must be set as environment variable`);
    }
    return value || "";
};

export const env = {
    // ENV config
    PORT: parseVar("PORT", "5000"),
    API_URL: parseVar("API_URL", "http://localhost:5000/api"),
    SECRET_KEY: parseVar("SECRET_KEY"),
    FILEUPLOAD_MAX_SIZE: Number(parseVar("FILEUPLOAD_MAX_SIZE", "100")),
    JSON_MAX_SIZE: parseVar("JSON_MAX_SIZE"),
    MAX_ITEMS_PER_PAGE: Number(parseVar("MAX_ITEMS_PER_PAGE", "100")),
    JWT_EXPIRATION: Number(parseVar("JWT_EXPIRATION", "3600")),
    ENV: parseVar("ENV"),

    // DATABASE config
    MONGO_URL: parseVar("MONGO_URL"),
    MONGO_DBNAME: parseVar("MONGO_DBNAME"),
    REDIS_URL: parseVar("REDIS_URL"),
    REDIS_DEFAULT_EXPIRATION: Number(
        parseVar("REDIS_DEFAULT_EXPIRATION", "3600")
    ),

    // HUGGING FACE config
    HF_API_TOKEN: parseVar("HF_API_TOKEN"),

    // GCP config
    GOOGLE_APPLICATION_CREDENTIALS: parseVar(
        "GOOGLE_APPLICATION_CREDENTIALS",
        ""
    ),
    GCP_PROJECT_ID: parseVar("GCP_PROJECT_ID"),
    GCS_BUCKET_NAME: parseVar("GCS_BUCKET_NAME"),
    GCS_BLOB_ACCESS_EXPIRATION: Number(
        parseVar("GCS_BLOB_ACCESS_EXPIRATION", "3600")
    ),
    GCS_EMULATOR_PRIVATE_URL: parseVar("GCS_EMULATOR_PRIVATE_URL", ""),
    GCS_EMULATOR_PUBLIC_URL: parseVar("GCS_EMULATOR_PUBLIC_URL", ""),
};

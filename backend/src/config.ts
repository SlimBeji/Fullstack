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

export default {
    // ENV config
    PORT: parseVar("PORT", "5000"),
    SECRET_KEY: parseVar("SECRET_KEY"),
    JSON_MAX_SIZE: parseVar("JSON_MAX_SIZE"),
    MAX_ITEMS_PER_PAGE: Number(parseVar("MAX_ITEMS_PER_PAGE", "100")),
    JWT_EXPIRATION: Number(parseVar("JWT_EXPIRATION", "3600")),
    ENV: parseVar("ENV"),

    // DATABASE config
    MONGO_URL: parseVar("MONGO_URL"),
    MONGO_DBNAME: parseVar("MONGO_DBNAME"),

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

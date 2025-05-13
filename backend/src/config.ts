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

// ENV config
export const PORT = parseVar("PORT", "5000");
export const SECRET_KEY = parseVar("SECRET_KEY");
export const JSON_MAX_SIZE = parseVar("JSON_MAX_SIZE");
export const ENV = parseVar("ENV");

// DATABASE config
export const MONGO_URL = parseVar("MONGO_URL");
export const MONGO_DBNAME = parseVar("MONGO_DBNAME");

// GCP config
export const GOOGLE_APPLICATION_CREDENTIALS = parseVar(
    "GOOGLE_APPLICATION_CREDENTIALS",
    ""
);
export const GCP_PROJECT_ID = parseVar("GCP_PROJECT_ID");
export const GCS_BUCKET_NAME = parseVar("GCS_BUCKET_NAME");
export const GCS_STORAGE_EMULATOR_HOST = parseVar("GCS_STORAGE_EMULATOR_HOST");
export const GCS_BASE_MEDIA_URL = parseVar("GCS_BASE_MEDIA_URL");
export const GCS_BLOB_ACCESS_EXPIRATION = parseVar(
    "GCS_BLOB_ACCESS_EXPIRATION"
);

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
export const JWT_EXPIRATION = Number(parseVar("JWT_EXPIRATION", "3600"));
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
export const GCS_BLOB_ACCESS_EXPIRATION = Number(
    parseVar("GCS_BLOB_ACCESS_EXPIRATION", "3600")
);
export const GCS_EMULATOR_PRIVATE_URL = parseVar("GCS_EMULATOR_PRIVATE_URL");
export const GCS_EMULATOR_PUBLIC_URL = parseVar("GCS_EMULATOR_PUBLIC_URL");

export const GCP_CONFIG = {
    projectId: GCP_PROJECT_ID,
    bucketName: GCS_BUCKET_NAME,
    urlExpiration: GCS_BLOB_ACCESS_EXPIRATION,
    emulator: {
        privateUrl: GCS_EMULATOR_PRIVATE_URL,
        publicUrl: GCS_EMULATOR_PUBLIC_URL,
    },
    credentialsFile: GOOGLE_APPLICATION_CREDENTIALS,
};

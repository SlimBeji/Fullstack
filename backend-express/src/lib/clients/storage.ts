import {
    Bucket,
    SaveOptions,
    Storage,
    StorageOptions,
} from "@google-cloud/storage";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import path from "path";

import { env } from "@/config";
import { FileToUpload } from "@/types";

interface GCSConfig {
    GCP_PROJECT_ID: string;
    GCS_BUCKET_NAME: string;
    GCS_BLOB_ACCESS_EXPIRATION?: number;
    GOOGLE_APPLICATION_CREDENTIALS?: string;
    GCS_EMULATOR_PRIVATE_URL?: string;
    GCS_EMULATOR_PUBLIC_URL?: string;
}

export class CloudStorage {
    private readonly projectId: string;
    private readonly bucketName: string;
    private readonly urlExpiration: number;
    private readonly emulatorPublicUrl?: string;
    private readonly emulatorPrivateUrl?: string;
    private readonly credentialsFile?: string;

    private readonly storage: Storage;
    private readonly bucket: Bucket;

    constructor(config: GCSConfig) {
        // Setting base configuration
        this.projectId = config.GCP_PROJECT_ID;
        this.bucketName = config.GCS_BUCKET_NAME;
        this.urlExpiration = config.GCS_BLOB_ACCESS_EXPIRATION || 3600;
        this.emulatorPublicUrl = config.GCS_EMULATOR_PUBLIC_URL;
        this.emulatorPrivateUrl = config.GCS_EMULATOR_PRIVATE_URL;
        this.credentialsFile = config.GOOGLE_APPLICATION_CREDENTIALS;

        // Creating the storage object
        const options = this.getStorageOptions();
        this.storage = new Storage(options);

        // Initialize the bucket in the emulator if needed
        if (this.isEmulator) {
            this.initEmulator().catch((err) => {
                console.error("Failed to initialize emulator:", err);
            });
        }

        // Select the bucket
        this.bucket = this.storage.bucket(this.bucketName);
    }

    get isEmulator(): boolean {
        return !!this.emulatorPrivateUrl && !!this.emulatorPublicUrl;
    }

    private getStorageOptions(): StorageOptions {
        const baseConfig: StorageOptions = { projectId: this.projectId };

        if (this.isEmulator) {
            return {
                ...baseConfig,
                apiEndpoint: `${this.emulatorPrivateUrl}`,
            };
        }

        if (this.credentialsFile && existsSync(this.credentialsFile)) {
            return {
                ...baseConfig,
                keyFilename: this.credentialsFile,
            };
        }

        return baseConfig;
    }

    private async initEmulator(): Promise<void> {
        try {
            await this.storage.createBucket(this.bucketName);
            console.log(`Created bucket ${this.bucketName} in emulator`);
        } catch (err) {
            // error status code 409 = bucket exists
            if ((err as any).code !== 409) throw err;
        }
    }

    private getEmulatorFileUrl(filename: string): string {
        return `${this.emulatorPublicUrl}/download/storage/v1/b/${
            this.bucketName
        }/o/${encodeURIComponent(filename)}?alt=media`;
    }

    public async getSignedUrl(
        filename: string,
        expiration?: number
    ): Promise<string> {
        if (this.isEmulator) {
            return this.getEmulatorFileUrl(filename);
        }

        expiration = expiration || this.urlExpiration;
        const file = this.bucket.file(filename);
        const [url] = await file.getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + expiration * 1000,
        });
        return url;
    }

    public async uploadFile(
        file: FileToUpload | string | null,
        destination?: string
    ): Promise<string> {
        if (!file) {
            return "";
        }

        if (typeof file === "string") {
            file = FileToUpload.fromPath(file);
        }

        const ext = path.extname(file.originalname);
        const baseFilename = path.basename(
            destination || file.originalname,
            ext
        );
        const filename = `${baseFilename}_${randomUUID()}${ext}`.toLowerCase();
        const blob = this.bucket.file(filename);
        const metadata: SaveOptions = {
            contentType: file.mimetype,
            metadata: { contentType: file.mimetype },
        };
        await blob.save(file.buffer, metadata);
        return blob.name;
    }

    public async deleteFile(filename: string): Promise<boolean> {
        try {
            const blob = this.bucket.file(filename);
            await blob.delete();
            return true;
        } catch (error) {
            // 404 error when the filename does not exists
            if ((error as any).code !== 404) {
                throw error;
            }
            return false;
        }
    }
}

export const storage = new CloudStorage(env);

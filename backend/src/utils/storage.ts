import { Storage, StorageOptions, SaveOptions } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import path from "path";

import { existsSync } from "fs";

export class CloudStorage {
    private readonly envMode: string;
    private readonly credentialsFile: string;
    private readonly projectId: string;
    private readonly bucketName: string;
    private readonly emulatorHost: string;
    private readonly baseMediaUrl: string;
    private readonly accessExpiration: number;
    private readonly storage: Storage;

    constructor() {
        // Parsing env variables
        this.envMode = process.env.ENV || "dev";
        this.credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
        this.projectId = process.env.GCP_PROJECT_ID || "dev-project";
        this.bucketName = process.env.GCS_BUCKET_NAME || "dev-bucket";
        this.emulatorHost = process.env.GCS_STORAGE_EMULATOR_HOST || "";
        this.baseMediaUrl = process.env.GCS_BASE_MEDIA_URL || "";
        this.accessExpiration =
            Number(process.env.GCS_BLOB_ACCESS_EXPIRATION) || 3600;

        // Creating the storage object
        const options = this.getStorageOptions();
        this.storage = new Storage(options);

        // Initialize the bucket in the emulator if needed
        if (this.isEmulator) {
            this.initEmulator().catch((err) => {
                console.error("Failed to initialize emulator:", err);
            });
        }
    }

    get isEmulator(): boolean {
        return this.envMode === "dev" && !!this.emulatorHost;
    }

    private getStorageOptions(): StorageOptions {
        const baseConfig: StorageOptions = { projectId: this.projectId };

        if (this.isEmulator) {
            return {
                ...baseConfig,
                apiEndpoint: `${this.emulatorHost}`,
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

    private getEmulatorUrl(filename: string): string {
        return `${this.baseMediaUrl}/download/storage/v1/b/${
            this.bucketName
        }/o/${encodeURIComponent(filename)}?alt=media`;
    }

    public async getSignedUrl(
        filename: string,
        expiration?: number
    ): Promise<string> {
        if (this.isEmulator) {
            return this.getEmulatorUrl(filename);
        }

        expiration = expiration || this.accessExpiration;
        const bucket = this.storage.bucket(this.bucketName);
        const file = bucket.file(filename);
        const [url] = await file.getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + expiration * 1000,
        });
        return url;
    }

    async uploadFile(
        file: Express.Multer.File,
        destination?: string
    ): Promise<string> {
        const ext = path.extname(file.originalname);
        const baseFilename = path.basename(
            destination || file.originalname,
            ext
        );
        const filename = `${baseFilename}_${randomUUID()}${ext}`.toLowerCase();
        const bucket = this.storage.bucket(this.bucketName);
        const blob = bucket.file(filename);
        const metadata: SaveOptions = {
            contentType: file.mimetype,
            metadata: { contentType: file.mimetype },
        };
        await blob.save(file.buffer, metadata);
        return blob.name;
    }
}

export const storage = new CloudStorage();

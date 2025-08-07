import { readFileSync } from "fs";
import mime from "mime-types";
import path from "path";

import { env } from "../config";

export class PaginationData {
    constructor(
        public page: number = 1,
        public size: number = env.MAX_ITEMS_PER_PAGE
    ) {}

    public get skip(): number {
        return (this.page - 1) * this.size;
    }
}

export interface PaginatedData<T> {
    page: number;
    totalPages: number;
    totalCount: number;
    data: T[];
}

export class FileToUpload {
    constructor(
        public originalname: string,
        public mimetype: string,
        public buffer: Buffer<ArrayBufferLike>
    ) {}

    public static fromPath(filePath: string): FileToUpload {
        const originalname = path.basename(filePath);
        const mimetype = mime.lookup(filePath) || "application/octet-stream";
        const buffer = readFileSync(filePath);
        return new FileToUpload(originalname, mimetype, buffer);
    }
}

export interface PaginationData {
    page: number;
    size: number;
    skip: number;
}

export interface PaginatedData<T> {
    page: number;
    totalPages: number;
    totalCount: number;
    data: T[];
}

export interface FileToUpload {
    originalname: string;
    mimetype: string;
    buffer: Buffer<ArrayBufferLike>;
}

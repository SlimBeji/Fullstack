import { env } from "@/config";

export interface PaginatedData<T> {
    page: number;
    totalPages: number;
    totalCount: number;
    data: T[];
}

export class PaginationData {
    constructor(
        public page: number = 1,
        public size: number = env.MAX_ITEMS_PER_PAGE
    ) {}

    public get skip(): number {
        return (this.page - 1) * this.size;
    }
}

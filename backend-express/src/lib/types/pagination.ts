export interface PaginatedData<T> {
    page: number;
    total_pages: number;
    total_count: number;
    data: T[];
}

export class PaginationData {
    constructor(
        public page: number,
        public size: number
    ) {}

    public get skip(): number {
        return (this.page - 1) * this.size;
    }
}

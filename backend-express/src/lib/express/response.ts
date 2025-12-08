export interface PaginatedData<T> {
    page: number;
    totalPages: number;
    totalCount: number;
    data: T[];
}

import { env } from "@/config";

export class PaginationData {
    constructor(
        public page: number = 1,
        public size: number = env.MAX_ITEMS_PER_PAGE
    ) {}

    public get skip(): number {
        return (this.page - 1) * this.size;
    }
}

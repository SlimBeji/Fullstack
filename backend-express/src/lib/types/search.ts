import { WhereFilters } from "./filters";

export interface SearchQuery<
    Selectable extends string,
    Sortable extends string,
    Searchable extends string,
> {
    page?: number;
    size?: number;
    orderby?: Sortable[];
    select?: Selectable[];
    where?: WhereFilters<Searchable>;
}

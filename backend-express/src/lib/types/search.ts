import { WhereFilters } from "./filters";

export interface SearchQuery<
    Selectables extends string,
    Sortables extends string,
    Searchables extends string,
> {
    page?: number;
    size?: number;
    orderby?: Sortables[];
    select?: Selectables[];
    where?: WhereFilters<Searchables>;
}

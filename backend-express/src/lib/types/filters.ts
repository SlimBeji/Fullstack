export type FilterOperation =
    | "eq"
    | "ne"
    | "in"
    | "nin"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "like"
    | "start"
    | "end"
    | "case";

export type Filter = { op: FilterOperation; val: any };

export type FindQueryFilters<T extends string> = {
    [K in T]?: Filter[];
};

export interface FindQuery<
    Selectables extends string,
    Sortables extends string,
    Searchables extends string,
> {
    page?: number;
    size?: number;
    orderby?: Sortables[];
    select?: Selectables[];
    where?: FindQueryFilters<Searchables>;
}

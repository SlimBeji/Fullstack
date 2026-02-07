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

export interface FieldFilter {
    eq?: any | null;
    ne?: any | null;
    in?: any[];
    nin?: any[];
    lt?: any;
    lte?: any;
    gt?: any;
    gte?: any;
    like?: string;
    start?: string;
    end?: string;
    case?: boolean;
}

export type FindQueryFilters<T extends string> = {
    [K in T]?: FieldFilter;
};

export interface FindQuery<
    Selectables extends string,
    Sortables extends string,
    Searchables extends string,
> {
    page?: number;
    size?: number;
    sort?: Sortables[];
    fields?: Selectables[];
    filters?: FindQueryFilters<Searchables>;
}

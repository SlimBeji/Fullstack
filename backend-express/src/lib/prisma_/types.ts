export interface ModelDelegate<
    Read,
    Create,
    Update,
    Select,
    OrderBy,
    Where,
    WhereUnique,
> {
    create(args: { data: Create; select?: Select }): Promise<Partial<Read>>;
    findMany(args?: {
        where?: Where;
        take?: number;
        skip?: number;
        orderBy?: OrderBy[];
        select?: Select;
    }): Promise<Partial<Read>[]>;
    findUnique(args: {
        where: WhereUnique;
        select?: Select;
    }): Promise<Partial<Read> | null>;
    findFirst(args?: {
        where?: Where;
        orderBy?: OrderBy[];
        select?: Select;
    }): Promise<Partial<Read> | null>;
    update(args: {
        where: WhereUnique;
        data: Update;
        select?: Select;
    }): Promise<Partial<Read>>;
    delete(args: {
        where: WhereUnique;
        select?: Select;
    }): Promise<Partial<Read>>;
    count(args?: { where?: Where }): Promise<number>;
}

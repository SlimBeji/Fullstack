export { Prisma } from "@/_generated/prisma/client";

export interface NumberFilter {
    equals?: number | null;
    not?: number | null;
    in?: number[];
    notIn?: number[];
    lt?: number;
    lte?: number;
    gt?: number;
    gte?: number;
}

export interface StringFilter {
    equals?: string | null;
    not?: string | null;
    in?: string[];
    notIn?: string[];
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    mode?: "default" | "insensitive";
}

export interface DateTimeFilter {
    equals?: Date | string | null;
    not?: Date | string | null;
    in?: (Date | string)[];
    notIn?: (Date | string)[];
    lt?: Date | string;
    lte?: Date | string;
    gt?: Date | string;
    gte?: Date | string;
}

export interface BoolFilter {
    equals?: boolean | null;
    not?: boolean | null;
}

export interface IndexFilter {
    equals?: number | null;
    not?: number | null;
    in?: number[];
    notIn?: number[];
}

export interface PrismaFieldFilter {
    equals?: any | null;
    not?: any | null;
    in?: any[];
    notIn?: any[];
    lt?: any;
    lte?: any;
    gt?: any;
    gte?: any;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    mode?: "default" | "insensitive";
}

export interface PrismaJsonFilter extends PrismaFieldFilter {
    path: string[];
}

export interface PrismaFindQuery<Select, OrderBy, Where> {
    where?: Where;
    take?: number;
    skip?: number;
    orderBy?: OrderBy[];
    select?: Select;
}

export interface ModelDelegate<
    DbModel,
    Create,
    Update,
    Select,
    OrderBy,
    Where,
    WhereUnique,
> {
    create(args: { data: Create; select?: Select }): Promise<Partial<DbModel>>;
    findMany(
        args?: PrismaFindQuery<Select, OrderBy, Where>
    ): Promise<Partial<DbModel>[]>;
    findFirst(args?: {
        where?: Where;
        orderBy?: OrderBy[];
        select?: Select;
    }): Promise<Partial<DbModel> | null>;
    update(args: {
        where: WhereUnique;
        data: Update;
        select?: Select;
    }): Promise<Partial<DbModel>>;
    delete(args: {
        where: WhereUnique;
        select?: Select;
    }): Promise<Partial<DbModel>>;
    count(args?: { where?: Where }): Promise<number>;
}

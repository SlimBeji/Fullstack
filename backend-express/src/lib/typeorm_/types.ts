import { ObjectLiteral } from "typeorm";

export type OrderBy = {
    field: string;
    order: "ASC" | "DESC";
};

export type SelectField = {
    select: string;
    table?: string;
    relation?: string;
    level?: number;
};

export type AbstractEntity = ObjectLiteral & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
};

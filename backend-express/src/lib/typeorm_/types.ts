import { ObjectLiteral } from "typeorm";

export type OrderBy = {
    field: string;
    order: "ASC" | "DESC";
};

export type Join = {
    // name of the table to join
    table: string;
    // how the join is performed
    relation: string;
    // the level of the join, used to sort the joins
    // and apply the parent<->child before child<->grandchild
    // use 1 for children and 2 for grand children for example
    level: number;
};

export type SelectField = {
    // the field to select
    select: string;
    // the joins needed to get the data
    // size is 1 for direct childs, 2 for grandcjild etc...
    joins?: Join[];
};

export type AbstractEntity = ObjectLiteral & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
};

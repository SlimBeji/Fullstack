// This module is used to avoid circular imports
// with cruds classes importing each others

import { DataSource } from "typeorm";

import { Tables, User } from "../orm";

export const userExists = async (
    datasource: DataSource,
    id: number | string
): Promise<boolean> => {
    const repositroy = datasource.getRepository(User);
    const result = await repositroy
        .createQueryBuilder(Tables.users)
        .select(["id"])
        .andWhere("id = :id_eq", { id_eq: id })
        .getRawOne();
    return !!result;
};

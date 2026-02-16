import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

import { Filter, FindQueryFilters } from "../types";
import { camelToSnake } from "../utils";
import { Join, OrderBy, SelectField } from "./types";

const parseOrderBy = (input: string): OrderBy => {
    const order = input.startsWith("-") ? "DESC" : "ASC";
    const field = order === "DESC" ? input.substring(1) : input;
    return { field, order };
};

export const applyOrderBy = <Entity extends ObjectLiteral>(
    query: SelectQueryBuilder<Entity>,
    clauses: string[],
    mapFunc: (f: string) => string
): SelectQueryBuilder<Entity> => {
    if (clauses.length === 0) return query;

    // Apply first OrderBy
    let parsed = parseOrderBy(clauses[0]);
    query = query.orderBy(mapFunc(parsed.field), parsed.order);

    // Apply remaining OrderBy
    clauses.slice(1).forEach((f) => {
        let parsed = parseOrderBy(f);
        query = query.addOrderBy(mapFunc(parsed.field), parsed.order);
    });

    // Return Query
    return query;
};

export const applySelect = <Entity extends ObjectLiteral>(
    query: SelectQueryBuilder<Entity>,
    clauses: string[],
    mapFunc: (f: string) => SelectField[]
): SelectQueryBuilder<Entity> => {
    if (clauses.length === 0) return query;

    // Convert to SelectField[] and deduplicate
    const selectSet = new Set<string>();
    const joinMap = new Map<string, Join>();
    clauses.flatMap(mapFunc).forEach((selectField) => {
        // extracting the fields to select
        if (!selectSet.has(selectField.select)) {
            selectSet.add(selectField.select);
        }

        // extracting the joins to perform
        if (selectField.joins && selectField.joins.length > 0) {
            selectField.joins.forEach((join) => {
                if (!joinMap.has(join.table)) {
                    joinMap.set(join.table, join);
                }
            });
        }
    });

    // Sort joins by level (parent before child)
    const sortedJoins = Array.from(joinMap.values()).sort(
        (a, b) => a.level - b.level
    );

    // Apply joins in order
    sortedJoins.forEach((join) => {
        query = query.leftJoinAndSelect(join.relation, join.table);
    });

    // Apply the select
    query = query.select(Array.from(selectSet));

    // Return query
    return query;
};

const applySingleWhere = <Entity extends ObjectLiteral>(
    query: SelectQueryBuilder<Entity>, // the query to update
    field: string, // the raw query filter to use as prefix for variables
    path: string, // the sql statement to
    filter: Filter, // the filter to apply
    isFirst: boolean // first where statetmnt or not
): SelectQueryBuilder<Entity> => {
    field = camelToSnake(field);
    let whereQuery = "";
    let varname = "";
    let params = {} as Record<string, any>;

    switch (filter.op) {
        case "eq":
            varname = `${field}_eq`;
            whereQuery = `${path} = :${varname}`;
            params = { [varname]: filter.val };
            break;
        case "ne":
            varname = `${field}_ne`;
            whereQuery = `${path} != :${varname}`;
            params = { [varname]: filter.val };
            break;
        case "null":
            if ((filter.val as boolean) === true) {
                whereQuery = `${path} IS NULL`;
            } else {
                whereQuery = `${path} IS NOT NULL`;
            }
            break;
        case "in":
            varname = `${field}_in`;
            whereQuery = `${path} IN (:...${varname})`;
            params = { [varname]: filter.val };
            break;
        case "nin":
            varname = `${field}_nin`;
            whereQuery = `${path} NOT IN (:...${varname})`;
            params = { [varname]: filter.val };
            break;
        case "lt":
            varname = `${field}_lt`;
            whereQuery = `${path} < :${varname}`;
            params = { [varname]: filter.val };
            break;
        case "lte":
            varname = `${field}_lte`;
            whereQuery = `${path} <= :${varname}`;
            params = { [varname]: filter.val };
            break;
        case "gt":
            varname = `${field}_gt`;
            whereQuery = `${path} > :${varname}`;
            params = { [varname]: filter.val };
            break;
        case "gte":
            varname = `${field}_gte`;
            whereQuery = `${path} >= :${varname}`;
            params = { [varname]: filter.val };
            break;
        case "like":
            varname = `${field}_like`;
            whereQuery = `${path} LIKE :${varname}`;
            params = { [varname]: `%${filter.val}%` };
            break;
        case "ilike":
            varname = `${field}_ilike`;
            whereQuery = `${path} ILIKE :${varname}`;
            params = { [varname]: `%${filter.val}%` };
            break;
        case "regex":
            varname = `${field}_regex`;
            whereQuery = `${path} ~* :${varname}`;
            params = { [varname]: filter.val };
            break;
        default:
            throw new Error(`Unknown field filter operator ${filter.op}`);
    }

    if (isFirst) {
        query = query.where(whereQuery, params);
    } else {
        query = query.andWhere(whereQuery, params);
    }
    return query;
};

export const applyWhere = <
    Entity extends ObjectLiteral,
    Searchables extends string,
>(
    query: SelectQueryBuilder<Entity>,
    clauses: FindQueryFilters<Searchables>,
    mapFunc: (f: string) => string
): SelectQueryBuilder<Entity> => {
    let isFirst = true;
    for (const field in clauses) {
        const fieldFilters = clauses[field];
        if (!fieldFilters) continue;
        const path = mapFunc(field);
        fieldFilters.forEach((filter) => {
            query = applySingleWhere(query, field, path, filter, isFirst);
            isFirst = false;
        });
    }
    return query;
};

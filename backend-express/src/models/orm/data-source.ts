import "reflect-metadata";

import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: ["/app/src/models/orm/*.entity.ts"],
    migrations: ["/app/src/models/migrations/*.ts"],
    synchronize: false,
});

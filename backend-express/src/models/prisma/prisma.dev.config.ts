import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "schema.prisma",
    migrations: {
        path: "prisma/migrations/dev",
    },
    datasource: {
        url: env("DATABASE_URL"),
    },
});

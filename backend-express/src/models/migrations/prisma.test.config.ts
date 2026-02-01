import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "schema.prisma",
    migrations: {
        path: "prisma/migrations/test",
    },
    datasource: {
        url: env("DATABASE_TEST_URL"),
    },
});

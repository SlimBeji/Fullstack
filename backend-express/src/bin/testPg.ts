import { pgClient } from "@/services/instances";

async function debug() {
    const tables = await pgClient.listTables();
    console.log(tables);
}

if (require.main === module) {
    pgClient
        .connect()
        .then(debug)
        .finally(() => pgClient.close());
}

import { pgClient } from "@/services/instances";

async function debug() {
    const tables = await pgClient.client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log(tables);
}

if (require.main === module) {
    pgClient
        .connect()
        .then(debug)
        .finally(() => pgClient.close());
}

import { redisClient } from "../lib/clients";
import { closeAll, startAll } from "../lib/sync";

async function test() {
    redisClient.set("Test", "Test");
}

if (require.main === module) {
    startAll().then(test).finally(closeAll);
}

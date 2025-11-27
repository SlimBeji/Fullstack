import { redisClient } from "@/lib/clients";
import { closeAll, startAll } from "@/lib/setup";

async function test() {
    await redisClient.set("secret_number", 158);
    console.log(await redisClient.get("secret_number"));
    await redisClient.delete("secret_number");
    console.log(await redisClient.get("secret_number"));
}

if (require.main === module) {
    startAll().then(test).finally(closeAll);
}

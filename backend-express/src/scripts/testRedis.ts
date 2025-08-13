import { createToken } from "../api/auth";
import { redisClient } from "../lib/clients";
import { closeAll, startAll } from "../lib/sync";
import { crudUser } from "../models/crud";

async function test() {
    const user = await crudUser.getByEmail("mslimbeji@gmail.com");
    const encodedToken = await createToken(user!);
    redisClient.set("Test", "Test");
    console.log(encodedToken);
}

if (require.main === module) {
    startAll().then(test).finally(closeAll);
}

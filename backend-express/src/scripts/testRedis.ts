import { createToken } from "../api/auth";
import { closeAll, connectDbs, redisClient } from "../lib/clients";
import { crudUser } from "../models/crud";

async function test() {
    const user = await crudUser.getByEmail("mslimbeji@gmail.com");
    const encodedToken = await createToken(user!);
    redisClient.set("Test", "Test");
    console.log(encodedToken);
}

if (require.main === module) {
    connectDbs().then(test).finally(closeAll);
}

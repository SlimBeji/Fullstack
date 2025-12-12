import { redisClient } from "@/services/instances";

async function test() {
    await redisClient.set("secret_number", 158);
    console.log(await redisClient.get("secret_number"));
    await redisClient.delete("secret_number");
    console.log(await redisClient.get("secret_number"));
}

if (require.main === module) {
    redisClient
        .connect()
        .then(test)
        .finally(() => redisClient.close());
}

import { env } from "../../config";

export const config = {
    connection: { url: env.REDIS_URL },
};

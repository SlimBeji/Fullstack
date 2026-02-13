import "reflect-metadata";

import app from "@/api";
import { env } from "@/config";
import { startAll } from "@/services/setup";

if (require.main === module) {
    startAll()
        .then(() => {
            app.listen(env.PORT, () => {
                console.log(`Listening on port ${env.PORT}`);
            });
        })
        .catch((err) => {
            console.log("Could not start the app");
            throw err;
        });
}

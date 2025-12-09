import app from "@/api";
import { env } from "@/config/env";
import { startAll } from "@/services";

// Connect Mongoose than run the app
if (require.main === module) {
    startAll()
        .then(() => {
            app.listen(env.PORT, () => {
                console.log(`Listening on port ${env.PORT}`);
            });
        })
        .catch(() => {
            console.log("Could not stablish connection to database");
        });
}

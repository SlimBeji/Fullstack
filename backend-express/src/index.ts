import app from "./api";
import { env } from "./config";
import { connectDbs } from "./lib/setup";

// Connect Mongoose than run the app
if (require.main === module) {
    connectDbs()
        .then(() => {
            app.listen(env.PORT, () => {
                console.log(`Listening on port ${env.PORT}`);
            });
        })
        .catch(() => {
            console.log("Could not stablish connection to database");
        });
}

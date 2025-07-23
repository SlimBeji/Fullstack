import { connectDbs } from "./lib/clients";
import { env } from "./config";
import app from "./api";

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

import { closeAll, startAll } from "../lib/sync";
import { seedDb } from "../models/examples";

if (require.main === module) {
    startAll()
        .then(() => seedDb(true))
        .finally(closeAll);
}

import { connectDbs, closeAll } from "../lib/clients";
import { dumpDb } from "../models/examples";

if (require.main === module) {
    connectDbs()
        .then(() => dumpDb(true))
        .finally(closeAll);
}

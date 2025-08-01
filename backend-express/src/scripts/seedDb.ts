import { closeAll, connectDbs } from "../lib/clients";
import { seedDb } from "../models/examples";

if (require.main === module) {
    connectDbs()
        .then(() => seedDb(true))
        .finally(closeAll);
}

import { connectDbs, closeDbs } from "../lib/clients";
import { seedDb } from "../models/examples";

if (require.main === module) {
    connectDbs().then(seedDb).finally(closeDbs);
}

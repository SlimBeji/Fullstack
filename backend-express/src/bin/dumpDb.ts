import { dumpDb } from "@/models/examples";
import { closeDbs, connectDbs } from "@/services/setup";

if (require.main === module) {
    connectDbs()
        .then(() => dumpDb(true))
        .finally(closeDbs);
}

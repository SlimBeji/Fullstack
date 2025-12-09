import { closeDbs, connectDbs } from "@/config/setup";
import { dumpDb } from "@/models/examples";

if (require.main === module) {
    connectDbs()
        .then(() => dumpDb(true))
        .finally(closeDbs);
}

import { dumpDb } from "@/models/examples";
import { closeDbs, connectDbs } from "@/services";

if (require.main === module) {
    connectDbs()
        .then(() => dumpDb(true))
        .finally(closeDbs);
}

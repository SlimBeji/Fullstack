import { closeAll, startAll } from "@/lib/sync";
import { dumpDb } from "@/models/examples";

if (require.main === module) {
    startAll()
        .then(() => dumpDb(true))
        .finally(closeAll);
}

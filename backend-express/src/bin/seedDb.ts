import { closeAll, startAll } from "@/lib/setup";
import { seedDb } from "@/models/examples";

if (require.main === module) {
    startAll()
        .then(() => seedDb(true))
        .finally(closeAll);
}

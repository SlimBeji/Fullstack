import { seedDb } from "@/models/examples";
import { closeDbs, connectDbs } from "@/services/setup";

if (require.main === module) {
    connectDbs()
        .then(() => seedDb(true))
        .finally(closeDbs);
}

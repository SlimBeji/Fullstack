import { closeDbs, connectDbs } from "@/config/setup";
import { seedDb } from "@/models/examples";

if (require.main === module) {
    connectDbs()
        .then(() => seedDb(true))
        .finally(closeDbs);
}

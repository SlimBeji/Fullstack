import { seedDb } from "@/models/examples";
import { closeDbs, connectDbs } from "@/services";

if (require.main === module) {
    connectDbs()
        .then(() => seedDb(true))
        .finally(closeDbs);
}

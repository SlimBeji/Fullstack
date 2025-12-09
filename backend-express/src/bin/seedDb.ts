import { db } from "@/lib/clients";
import { seedDb } from "@/models/examples";

if (require.main === module) {
    db.connect()
        .then(() => seedDb(true))
        .finally(() => db.close());
}

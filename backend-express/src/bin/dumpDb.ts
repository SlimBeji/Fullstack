import { closeClients, connectClients } from "@/lib/clients";
import { dumpDb } from "@/models/examples";

if (require.main === module) {
    connectClients()
        .then(() => dumpDb(true))
        .finally(closeClients);
}

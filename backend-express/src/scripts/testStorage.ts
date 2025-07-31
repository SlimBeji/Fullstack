import { closeAll, connectDbs, storage } from "../lib/clients";
import { getImagePath } from "../lib/utils";

async function test() {
    const path = getImagePath("avatar1.jpg");
    const destination = await storage.uploadFile(path);
    const url = await storage.getSignedUrl(destination);
    console.log(url);
}

if (require.main === module) {
    connectDbs().then(test).finally(closeAll);
}

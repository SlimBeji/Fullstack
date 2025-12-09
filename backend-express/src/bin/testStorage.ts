import { storage } from "@/lib/clients";
import { closeAll, startAll } from "@/lib/setup";
import { getImagePath } from "@/static";

async function test() {
    const path = getImagePath("avatar1.jpg");
    const destination = await storage.uploadFile(path);
    const url = await storage.getSignedUrl(destination);
    console.log(url);
}

if (require.main === module) {
    startAll().then(test).finally(closeAll);
}

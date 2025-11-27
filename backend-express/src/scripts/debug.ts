import { closeAll, startAll } from "@/lib/setup";

async function debug() {
    console.log("I was executed");
}

if (require.main === module) {
    startAll().then(debug).finally(closeAll);
}

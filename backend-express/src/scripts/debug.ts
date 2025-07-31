import { closeAll, connectDbs } from "../lib/clients";

async function debug() {
    console.log("I was executed");
}

if (require.main === module) {
    connectDbs().then(debug).finally(closeAll);
}

import { closeDbs, connectDbs } from "@/services/setup";

async function debug() {
    console.log("I was executed");
}

if (require.main === module) {
    connectDbs().then(debug).finally(closeDbs);
}

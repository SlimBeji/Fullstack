import { closeDbs, connectDbs } from "@/config/setup";

async function debug() {
    console.log("I was executed");
}

if (require.main === module) {
    connectDbs().then(debug).finally(closeDbs);
}

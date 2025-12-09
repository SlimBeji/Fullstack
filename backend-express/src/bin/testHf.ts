import { huggingFace } from "@/lib/clients";
import { closeAll, startAll } from "@/lib/setup";

async function test() {
    const result = await huggingFace.embedText(
        "I am trying to debug my code in go"
    );
    console.log(result);
}

if (require.main === module) {
    startAll().then(test).finally(closeAll);
}

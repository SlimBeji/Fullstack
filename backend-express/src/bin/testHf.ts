import { huggingFace } from "@/services/instances";

async function test() {
    const result = await huggingFace.embedText(
        "I am trying to debug my code in go"
    );
    console.log(result);
}

if (require.main === module) {
    test().then(() => console.log("Finished testing hugging face client"));
}

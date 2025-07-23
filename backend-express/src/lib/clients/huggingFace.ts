import axios, { AxiosInstance } from "axios";
import { env } from "../../config";

type EmbeddingResponse = number[][];

export class HuggingFaceClient {
    private readonly embedApi: AxiosInstance;

    constructor(
        private token: string,
        private embedModel = "sentence-transformers/all-MiniLM-L6-v2"
    ) {
        this.embedApi = axios.create({
            baseURL: `https://api-inference.huggingface.co/models/${this.embedModel}/pipeline/feature-extraction`,
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
        });
    }

    public async embedText(text: string): Promise<number[]> {
        const response = await this.embedApi.post<EmbeddingResponse>("", {
            inputs: [text],
        });
        return response.data[0];
    }
}

export const huggingFace = new HuggingFaceClient(env.HF_API_TOKEN);

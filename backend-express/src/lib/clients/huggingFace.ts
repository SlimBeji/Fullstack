import axios, { AxiosInstance } from "axios";

type EmbeddingResponse = number[][];

export interface HuggingFaceClientConfig {
    token: string;
    embedModel?: string;
    timeout?: number;
}

export class HuggingFaceClient {
    private readonly token: string;
    readonly embedModel: string;
    private readonly embedApi: AxiosInstance;
    readonly defaultTimeout: number;

    constructor(config: HuggingFaceClientConfig) {
        this.token = config.token;
        this.embedModel =
            config.embedModel || "sentence-transformers/all-MiniLM-L6-v2";
        this.defaultTimeout = (config.timeout || 20) * 1000;
        this.embedApi = axios.create({
            baseURL: `https://router.huggingface.co/hf-inference/models/${this.embedModel}/pipeline/feature-extraction`,
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            timeout: this.defaultTimeout,
        });
    }

    async embedText(text: string): Promise<number[]> {
        const response = await this.embedApi.post<EmbeddingResponse>("", {
            inputs: [text],
        });
        return response.data[0];
    }
}

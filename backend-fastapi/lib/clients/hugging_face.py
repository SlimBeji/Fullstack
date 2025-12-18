from http import HTTPStatus

import httpx

from lib.fastapi_ import ApiError


class HuggingFaceClientConfig:
    def __init__(
        self,
        token: str,
        embed_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        timeout: int = 20,
    ) -> None:
        self.token = token
        self.embed_model = embed_model
        self.timeout = timeout


class HuggingFaceClient:
    def __init__(self, config: HuggingFaceClientConfig) -> None:
        # Authentication
        self.token = config.token
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        self.default_timeout = config.timeout

        # Embedding
        self.embeding_model = config.embed_model
        self.embedding_model_url = f"https://router.huggingface.co/hf-inference/models/{self.embeding_model}"
        self.embedding_model_api = httpx.AsyncClient(
            base_url=self.embedding_model_url,
            headers=self.headers,
            timeout=self.default_timeout,
        )

    async def embed_text(self, text: str) -> list[float]:
        try:
            payload = {"inputs": [text]}
            response = await self.embedding_model_api.post(
                "/pipeline/feature-extraction",
                json=payload,
                timeout=self.default_timeout,
            )
            response.raise_for_status()
            embedding_response: list[list[float]] = response.json()
            return embedding_response[0]
        except Exception:
            raise ApiError(
                HTTPStatus.FAILED_DEPENDENCY,
                f"An unexpected error occured while embedding text {text}",
            )

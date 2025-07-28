from http import HTTPStatus

import httpx

from config import settings
from types_ import ApiError

DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class HuggingFaceClient:
    def __init__(
        self, token: str, embeding_model: str = DEFAULT_EMBEDDING_MODEL
    ) -> None:
        # Authentication
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

        # Embedding
        self.embeding_model = embeding_model
        self.embedding_model_url = (
            f"https://api-inference.huggingface.co/models/{self.embeding_model}"
        )
        self.embedding_model_api = httpx.AsyncClient(
            base_url=self.embedding_model_url, headers=self.headers
        )

    async def embed_text(self, text: str) -> list[float]:
        try:
            payload = {"inputs": [text]}
            response = await self.embedding_model_api.post(
                "/pipeline/feature-extraction", json=payload
            )
            response.raise_for_status()
            embedding_response: list[list[float]] = response.json()
            return embedding_response[0]
        except:
            raise ApiError(
                HTTPStatus.FAILED_DEPENDENCY,
                f"An unexpected error occured while embedding text {text}",
            )


hugging_face = HuggingFaceClient(settings.HF_API_TOKEN)

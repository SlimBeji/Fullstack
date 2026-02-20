import logging

from background.bgconfig import PlaceEmbbeddingData
from models.cruds import CrudsPlace
from services.instances import pg_client


async def place_embedding_task(payload: PlaceEmbbeddingData):
    async with pg_client.session() as session:
        cruds = CrudsPlace(session)
        place_id = payload["place_id"]
        result = await cruds.embed(place_id)
        logging.info(result)

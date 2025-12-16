import logging

from background.setup import PlaceEmbbeddingData
from models.crud import crud_place
from services.instances import hf_client


async def place_embedding_task(payload: PlaceEmbbeddingData):
    place_id = payload["place_id"]
    place = await crud_place.get_document(place_id)
    if place is None:
        logging.warning(f"No place with id {place_id} found in the database")
        return

    text = f"{place.title} - {place.description}"
    result = await hf_client.embed_text(text)
    place.embedding = result
    await crud_place.save_document(place)
    logging.info(result)

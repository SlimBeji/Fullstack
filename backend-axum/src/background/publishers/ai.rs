use crate::{
    background::bgconfig::AIJob,
    lib_::{clients::TaskPublisher, types_::ApiError},
};

pub async fn place_embedding(publisher: &TaskPublisher, place_id: u32) -> Result<(), ApiError> {
    if cfg!(test) {
        return Ok(());
    }
    let job = AIJob::PlaceEmbedding(place_id);
    publisher.push(job).await.map_err(|e| {
        ApiError::internal_error("failed to trigger place_embedding task", Box::new(e))
    })
}

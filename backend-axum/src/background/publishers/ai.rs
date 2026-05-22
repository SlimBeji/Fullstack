use crate::{
    background::bgconfig::{AIJob, PlaceEmbeddingTask},
    lib_::{clients::TaskPublisher, types_::ApiError},
};

pub async fn place_embedding(publisher: &TaskPublisher, id: u32) -> Result<(), ApiError> {
    if cfg!(test) {
        return Ok(());
    }
    let job = AIJob::PlaceEmbedding(PlaceEmbeddingTask { id });
    publisher.push(job).await.map_err(|e| {
        ApiError::internal_error("failed to trigger place_embedding task", Box::new(e))
    })
}

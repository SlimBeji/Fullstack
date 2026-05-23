use apalis::prelude::*;

use crate::{
    background::bgconfig::{AIJob, PlaceEmbeddingTask},
    lib_::clients::HandlerError,
    models::cruds::CrudsPlace,
    services::SharedState,
};

async fn handle_place_embedding(
    state: SharedState,
    payload: PlaceEmbeddingTask,
) -> Result<(), HandlerError> {
    let cruds = CrudsPlace::new(state);
    let result = cruds.embed(payload.id).await.map_err(|err| HandlerError {
        taskname: "place_embedding".to_string(),
        message: "womething went wrong when trying to update place embedding".to_string(),
        details: err.into_json(),
    })?;
    println!("{:?}", result);
    Ok(())
}

pub async fn handle_ai_tasks(job: AIJob, data: Data<SharedState>) -> Result<(), HandlerError> {
    let state = (*data).clone();
    match job {
        AIJob::PlaceEmbedding(payload) => handle_place_embedding(state, payload).await,
    }
}

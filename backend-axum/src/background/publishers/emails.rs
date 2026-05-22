use crate::{
    background::bgconfig::EmailJob,
    lib_::{clients::TaskPublisher, types_::ApiError},
};

pub async fn send_newsletter(
    publisher: &TaskPublisher,
    name: String,
    email: String,
) -> Result<(), ApiError> {
    if cfg!(test) {
        return Ok(());
    }
    let job = EmailJob::Send { name, email };
    publisher.push(job).await.map_err(|err| {
        ApiError::internal_error("failed to trigger send_newsletter task", Box::new(err))
    })
}

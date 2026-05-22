use apalis::prelude::*;

use crate::{
    background::bgconfig::{EmailJob, SendEmailTask},
    lib_::clients::HandlerError,
    services::SharedState,
};

async fn handle_send_newslettter(payload: SendEmailTask) -> Result<(), HandlerError> {
    println!(
        "Newsletter Email sent to {} as following addres: {}",
        payload.name, payload.email
    );
    Ok(())
}

pub async fn handle_email_tasks(_: Data<SharedState>, job: EmailJob) -> Result<(), HandlerError> {
    match job {
        EmailJob::Send(payload) => handle_send_newslettter(payload).await,
    }
}

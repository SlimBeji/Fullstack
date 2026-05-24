use apalis::prelude::*;
use apalis_cron::Tick;

use crate::{background::publishers, lib_::clients::HandlerError, services::SharedState};

pub const SEND_NEWSLETTER_TASKNAME: &str = "send_newsletter_task";
pub const SEND_NEWSLETTER_CRON: &str = "0 0 * * * *";

pub async fn send_newsletter_task(_: Tick, data: Data<SharedState>) -> Result<(), HandlerError> {
    let result = publishers::send_newsletter(
        &data.publisher,
        "Slim Beji".to_string(),
        "mslimbeji@gmail.com".to_string(),
    )
    .await;
    match result {
        Ok(()) => Ok(()),
        Err(err) => {
            println!(
                "Following error occured while trigerring {SEND_NEWSLETTER_TASKNAME}: {:?}",
                err
            );
            Err(HandlerError {
                taskname: SEND_NEWSLETTER_TASKNAME.to_string(),
                message: err.message.clone(),
                details: err.into_json(),
            })
        }
    }
}

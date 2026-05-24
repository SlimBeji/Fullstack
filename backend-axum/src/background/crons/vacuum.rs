use apalis::prelude::*;
use apalis_cron::Tick;

use crate::{
    background::bgconfig::{AIJob, EmailJob},
    lib_::clients::HandlerError,
    services::SharedState,
};

pub const VACUUM_APALIS_TASKNAME: &str = "Apalis vacuuming";
pub const VACUUM_APALIS_CRON: &str = "0 0 1 * * Sun"; // Every Sunday at 1 Am

pub async fn vacuum_apalis(_: Tick, state: Data<SharedState>) -> Result<(), HandlerError> {
    state.publisher.vaccum::<EmailJob>().await?;
    state.publisher.vaccum::<AIJob>().await?;
    Ok(())
}

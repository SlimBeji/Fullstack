use std::str::FromStr;

use apalis::layers::retry::RetryPolicy;
use apalis::prelude::*;
use apalis_cron::CronStream;
use cron::Schedule;

use crate::services::SharedState;

use crate::background::crons::emails::{
    SEND_NEWSLETTER_CRON, SEND_NEWSLETTER_TASKNAME, send_newsletter_task,
};

pub mod emails;

macro_rules! redis_scheduler {
    ($state:expr, $name:expr, $cron:expr, $handler:path, $retry:expr) => {{
        let state = $state.clone();

        move |_| {
            let cron_stream = CronStream::new(
                Schedule::from_str($cron)
                    .unwrap_or_else(|_| panic!("{} is not a valid cron config", $cron)),
            );

            WorkerBuilder::new(format!("{}-{}", $name, uuid::Uuid::new_v4()))
                .backend(cron_stream)
                .retry(RetryPolicy::retries($retry))
                .data(state.clone())
                .build($handler)
        }
    }};
}

pub fn create_scheduler(state: SharedState) -> Monitor {
    Monitor::new().register(redis_scheduler!(
        state,
        SEND_NEWSLETTER_TASKNAME,
        SEND_NEWSLETTER_CRON,
        send_newsletter_task,
        3
    ))
}

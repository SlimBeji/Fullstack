use apalis::layers::retry::RetryPolicy;
use apalis::prelude::*;
use apalis_redis::RedisStorage;

use crate::{
    background::{
        bgconfig::{AI_QUEUE, AIJob, EMAIL_QUEUE, EmailJob},
        handlers::{ai::handle_ai_tasks, email::handle_email_tasks},
    },
    services::SharedState,
};

pub mod ai;
pub mod email;

macro_rules! redis_worker {
    ($state:expr, $queue:expr, $job:ty, $handler:path, $retry:expr) => {{
        let state = $state.clone();

        move |_| {
            let storage = RedisStorage::<$job>::new(state.publisher.client.clone());

            // We try to use different Worker names on each start to avoid name collision
            // with past workers after restart before they got removed
            WorkerBuilder::new(format!("{}-{}", $queue, uuid::Uuid::new_v4()))
                .backend(storage)
                .retry(RetryPolicy::retries($retry))
                .data(state.clone())
                .build($handler)
        }
    }};
}

pub fn create_worker(state: SharedState) -> Monitor {
    Monitor::new()
        .register(redis_worker!(
            state,
            EMAIL_QUEUE,
            EmailJob,
            handle_email_tasks,
            3
        ))
        .register(redis_worker!(state, AI_QUEUE, AIJob, handle_ai_tasks, 5))
}

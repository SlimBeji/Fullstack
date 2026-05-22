use apalis::prelude::{Monitor, WorkerBuilder};
use apalis_redis::{ConnectionManager, RedisStorage};

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
    ($conn:expr, $state:expr, $queue:expr, $job:ty, $handler:path) => {{
        let conn = $conn.clone();
        let state = $state.clone();

        move |_| {
            let storage = RedisStorage::<$job>::new(conn.clone());

            WorkerBuilder::new($queue)
                .backend(storage)
                .data(state.clone())
                .build($handler)
        }
    }};
}

pub fn create_worker(conn: &ConnectionManager, state: SharedState) -> Monitor {
    Monitor::new()
        .register(redis_worker!(
            conn,
            state,
            EMAIL_QUEUE,
            EmailJob,
            handle_email_tasks
        ))
        .register(redis_worker!(conn, state, AI_QUEUE, AIJob, handle_ai_tasks))
}

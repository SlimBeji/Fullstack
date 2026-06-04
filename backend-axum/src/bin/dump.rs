use std::sync::Arc;

use backend::{models::examples::seed::dump_db, services::instances::AppState};

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState::new().await);
    dump_db(state, true).await;
}

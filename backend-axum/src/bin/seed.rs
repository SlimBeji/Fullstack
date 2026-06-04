use std::sync::Arc;

use backend::{models::examples::seed::seed_db, services::instances::AppState};

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState::new().await);
    seed_db(state, true).await;
}

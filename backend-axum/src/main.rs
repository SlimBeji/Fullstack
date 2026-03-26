use std::sync::Arc;

use tokio::net::TcpListener;

use crate::services::instances::AppState;

mod api;
mod config;
mod models;
mod services;

#[cfg(test)]
mod tests;

#[tokio::main]
async fn main() {
    let app_state = Arc::new(AppState::new().await);
    let app = api::get_app().with_state(app_state.clone());
    let listener = TcpListener::bind(config::ENV.bind_addr())
        .await
        .expect("Failed to bind listener");
    axum::serve(listener, app)
        .await
        .expect("Failed serve the app");
}

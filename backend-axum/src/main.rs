use std::sync::Arc;

use backend::background::crons::create_scheduler;
use backend::background::handlers::create_worker;
use backend::services::setup;
use tokio::net::TcpListener;

use backend::api;
use backend::config;
use backend::services::{instances::AppState, setup::shutdown_signal};

#[tokio::main]
async fn main() {
    // Init tracing
    setup::init_tracing();

    // Creating state, worker, app and http listener
    let app_state = Arc::new(AppState::new().await);
    let worker = create_worker(app_state.clone());
    let scheduler = create_scheduler(app_state.clone());
    let app = api::get_app().with_state(app_state.clone());
    let listener = TcpListener::bind(config::ENV.bind_addr())
        .await
        .expect("Failed to bind listener");

    // Create channel for termination
    let (tx, _) = tokio::sync::broadcast::channel::<()>(1);
    let mut axum_shutdown = tx.subscribe();
    let mut worker_shutdown = tx.subscribe();
    let mut scheduler_shutdown = tx.subscribe();

    // Start Axum server
    let mut axum_handle = tokio::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(async move {
                let _ = axum_shutdown.recv().await;
            })
            .await
    });

    // Start Apalis Worker
    let mut worker_handle = tokio::spawn(async move {
        tokio::select! {
            res = worker.run() => res,
            _ = worker_shutdown.recv() => Ok(()), // Stop if termination signal received
        }
    });

    // Start Apalis Scheduler
    let mut scheduler_handle = tokio::spawn(async move {
        tokio::select! {
            res = scheduler.run() => res,
            _ = scheduler_shutdown.recv() => Ok(()), // Stop if termination signal received
        }
    });

    // Poll Worker and HttpServer while waiting for shutdown_signal
    tokio::select! {
        _ = shutdown_signal() => {}
        _ = &mut axum_handle => {}
        _ = &mut worker_handle => {}
        _ = &mut scheduler_handle => {}
    }

    // Send termination signal to the sibscribers and await future
    let _ = tx.send(());
    if !axum_handle.is_finished() {
        let _ = axum_handle.await;
    }
    if !worker_handle.is_finished() {
        let _ = worker_handle.await;
    }
    if !scheduler_handle.is_finished() {
        let _ = scheduler_handle.await;
    }

    // Gracefull cleaning of the state
    if let Ok(state) = Arc::try_unwrap(app_state) {
        state.close().await
    };
    // If Err, than the state is still being used elsewhere (count > 1)
}

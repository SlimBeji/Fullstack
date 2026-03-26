use tokio::signal;
use tracing::info;

pub async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctr+C handler")
    };

    let terminate = async {
        let mut sigterm =
            signal::unix::signal(signal::unix::SignalKind::terminate())
                .expect("failed to install SIGTERM handler");

        sigterm.recv().await;
    };

    #[cfg(unix)]
    tokio::select! {
        _ = ctrl_c => {info!("Ctrl+C signal detected")},
        _ = terminate => {info!("SIGTERM signal detected")}
    }

    #[cfg(not(unix))]
    {
        ctrl_c.await; // Just wait for Ctrl+C on windows
        info!("Ctrl+C signal detected")
    }
}

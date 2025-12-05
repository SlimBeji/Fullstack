use tokio::net::TcpListener;

mod api;
mod config;

#[cfg(test)]
mod tests;

#[tokio::main]
async fn main() {
    let app = api::get_app();
    let listener = TcpListener::bind(config::ENV.bind_addr())
        .await
        .expect("Failed to bind listener");
    axum::serve(listener, app)
        .await
        .expect("Failed serve teh app");
}

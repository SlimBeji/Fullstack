use axum::{Router, routing::get};

pub const PATH: &str = "/hello-world";

pub fn routes() -> Router {
    Router::new()
        .route("/", get(hello))
        .route("/user", get(hello_user))
        .route("/admin", get(hello_admin))
}

async fn hello() -> String {
    "Hello World!".to_string()
}

async fn hello_user() -> String {
    "Hello User!".to_string()
}

async fn hello_admin() -> String {
    "Hello Admin!".to_string()
}

use axum::routing::get;
use utoipa_axum::router::OpenApiRouter;

pub const PATH: &str = "/hello-world";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .route("/", get(hello))
        .route("/user", get(hello_user))
        .route("/admin", get(hello_admin))
}

#[utoipa::path(get, path = "/")]
async fn hello() -> String {
    "Hello World!".to_string()
}

#[utoipa::path(get, path = "/user")]
async fn hello_user() -> String {
    "Hello User!".to_string()
}

#[utoipa::path(get, path = "/admin")]
async fn hello_admin() -> String {
    "Hello Admin!".to_string()
}

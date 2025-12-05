use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/hello-world";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(hello))
        .routes(routes!(hello_user))
        .routes(routes!(hello_admin))
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

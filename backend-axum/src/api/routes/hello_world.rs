use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/hello-world";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(hello))
        .routes(routes!(hello_user))
        .routes(routes!(hello_admin))
}

#[utoipa::path(
    get,
    path = "/",
    tag = "Hello World",
    summary = "Hello World Endpoint"
)]
async fn hello() -> String {
    "Hello World!".to_string()
}

#[utoipa::path(
    get,
    path = "/user",
    tag = "Hello World",
    summary = "Hello World Endpoint for authenticated users"
)]
async fn hello_user() -> String {
    "Hello User!".to_string()
}

#[utoipa::path(
    get,
    path = "/admin",
    tag = "Hello World",
    summary = "Hello World Endpoint for admins only"
)]
async fn hello_admin() -> String {
    "Hello Admin!".to_string()
}

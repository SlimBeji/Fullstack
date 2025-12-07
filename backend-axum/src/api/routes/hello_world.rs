use axum::{Json, response::IntoResponse};
use serde_json::json;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/hello-world";

pub fn routes() -> OpenApiRouter {
    let mut router = OpenApiRouter::new()
        .routes(routes!(hello))
        .routes(routes!(hello_user))
        .routes(routes!(hello_admin));

    let openapi = router.get_openapi_mut();
    let mut tag = Tag::new("Hello World");
    tag.description = Some("Hello World endpoints".to_string());
    openapi.tags = Some(vec![tag]);
    router
}

#[utoipa::path(
    get,
    path = "/",
    tag = "Hello World",
    summary = "Hello World Endpoint",
    responses((status = 200, content_type = "application/json"))
)]
async fn hello() -> impl IntoResponse {
    Json(json!({
        "message": "Hello World!"
    }))
}

#[utoipa::path(
    get,
    path = "/user",
    tag = "Hello World",
    summary = "Hello World Endpoint for authenticated users",
    responses((status = 200, content_type = "application/json"))
)]
async fn hello_user() -> impl IntoResponse {
    Json(json!({
        "message": "Hello Slim Beji!"
    }))
}

#[utoipa::path(
    get,
    path = "/admin",
    tag = "Hello World",
    summary = "Hello World Endpoint for admins only",
    responses((status = 200, content_type = "application/json"))
)]
async fn hello_admin() -> impl IntoResponse {
    Json(json!({
        "message": "Hello Admin Slim Beji!"
    }))
}

use axum::Json;
use serde_json::Value;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/auth";

pub fn routes() -> OpenApiRouter {
    let mut router = OpenApiRouter::new()
        .routes(routes!(signup_route))
        .routes(routes!(signin_route));

    let openapi = router.get_openapi_mut();
    let mut tag = Tag::new("Auth");
    tag.description =
        Some("Registration and Authentication endpoints".to_string());
    openapi.tags = Some(vec![tag]);
    router
}

#[utoipa::path(
    post,
    path = "/signup",
    tag = "Auth",
    summary = "User registration",
    responses((status = 200, content_type = "application/json"))
)]
async fn signup_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(
    post,
    path = "/signin",
    tag = "Auth",
    summary = "User authentication",
    responses((status = 200, content_type = "application/json"))
)]
async fn signin_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

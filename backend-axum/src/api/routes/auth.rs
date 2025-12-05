use axum::Json;
use serde_json::Value;
use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/auth";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(signup_route))
        .routes(routes!(signin_route))
}

#[utoipa::path(post, path = "/signup")]
async fn signup_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(post, path = "/signin")]
async fn signin_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

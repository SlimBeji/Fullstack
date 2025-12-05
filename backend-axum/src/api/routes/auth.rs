use axum::{Json, routing::post};
use serde_json::Value;
use utoipa_axum::router::OpenApiRouter;

pub const PATH: &str = "/auth";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .route("/signup", post(signup_route))
        .route("/signin", post(signin_route))
}

#[utoipa::path(post, path = "/signup")]
async fn signup_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(post, path = "/signin")]
async fn signin_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

use axum::{Json, Router, routing::post};
use serde_json::Value;

pub const PATH: &str = "/auth";

pub fn routes() -> Router {
    Router::new()
        .route("/signup", post(signup_route))
        .route("/signin", post(signin_route))
}

async fn signup_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

async fn signin_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

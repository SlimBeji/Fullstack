use axum::{
    Json,
    extract::Path,
    routing::{delete, get, post, put},
};
use serde_json::Value;
use utoipa_axum::router::OpenApiRouter;

pub const PATH: &str = "/users";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .route("/", get(get_users))
        .route("/query", post(query_users))
        .route("/", post(create_user))
        .route("/{id}", get(get_user))
        .route("/{id}", put(update_user))
        .route("/{id}", delete(delete_user))
}

#[utoipa::path(get, path = "/")]
async fn get_users() -> String {
    "Get Users".to_string()
}

#[utoipa::path(post, path = "/query")]
async fn query_users(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(post, path = "/")]
async fn create_user(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(get, path = "/{id}")]
async fn get_user(Path(id): Path<String>) -> String {
    format!("returning user {}", id)
}

#[utoipa::path(put, path = "/{id}")]
async fn update_user(
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    println!("{}", id);
    Json(body)
}

#[utoipa::path(delete, path = "/{id}")]
async fn delete_user(Path(id): Path<String>) -> String {
    format!("Deleted user {}", id)
}

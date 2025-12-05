use axum::{
    Json, Router,
    extract::Path,
    routing::{delete, get, post, put},
};
use serde_json::Value;

pub const PATH: &str = "/users";

pub fn routes() -> Router {
    Router::new()
        .route("/", get(get_users))
        .route("/query", post(query_users))
        .route("/", post(create_user))
        .route("/{id}", get(get_user))
        .route("/{id}", put(update_user))
        .route("/{id}", delete(delete_user))
}

async fn get_users() -> String {
    "Get Users".to_string()
}

async fn query_users(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

async fn create_user(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

async fn get_user(Path(id): Path<String>) -> String {
    format!("returning user {}", id)
}

async fn update_user(
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    println!("{}", id);
    Json(body)
}

async fn delete_user(Path(id): Path<String>) -> String {
    format!("Deleted user {}", id)
}

use axum::{
    Json, Router,
    extract::Path,
    routing::{delete, get, post, put},
};
use serde_json::Value;

pub const PATH: &str = "/places";

pub fn routes() -> Router {
    Router::new()
        .route("/", get(get_places))
        .route("/query", post(query_places))
        .route("/", post(create_place))
        .route("/{id}", get(get_place))
        .route("/{id}", put(update_place))
        .route("/{id}", delete(delete_place))
}

async fn get_places() -> String {
    "Get Places".to_string()
}

async fn query_places(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

async fn create_place(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

async fn get_place(Path(id): Path<String>) -> String {
    format!("returning place {}", id)
}

async fn update_place(
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    println!("{}", id);
    Json(body)
}

async fn delete_place(Path(id): Path<String>) -> String {
    format!("Deleted place {}", id)
}

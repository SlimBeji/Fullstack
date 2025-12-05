use axum::{
    Json,
    extract::Path,
    routing::{delete, get, post, put},
};
use serde_json::Value;
use utoipa_axum::router::OpenApiRouter;

pub const PATH: &str = "/places";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .route("/", get(get_places))
        .route("/query", post(query_places))
        .route("/", post(create_place))
        .route("/{id}", get(get_place))
        .route("/{id}", put(update_place))
        .route("/{id}", delete(delete_place))
}

#[utoipa::path(get, path = "/")]
async fn get_places() -> String {
    "Get Places".to_string()
}

#[utoipa::path(post, path = "/query")]
async fn query_places(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(post, path = "/")]
async fn create_place(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(get, path = "/{id}")]
async fn get_place(Path(id): Path<String>) -> String {
    format!("returning place {}", id)
}

#[utoipa::path(put, path = "/{id}")]
async fn update_place(
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    println!("{}", id);
    Json(body)
}

#[utoipa::path(delete, path = "/{id}")]
async fn delete_place(Path(id): Path<String>) -> String {
    format!("Deleted place {}", id)
}

use axum::{Json, extract::Path};
use serde_json::Value;
use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/places";

pub fn routes() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(get_places))
        .routes(routes!(query_places))
        .routes(routes!(create_place))
        .routes(routes!(get_place))
        .routes(routes!(update_place))
        .routes(routes!(delete_place))
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

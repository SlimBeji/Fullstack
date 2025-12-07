use axum::{Json, extract::Path};
use serde_json::Value;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/places";

pub fn routes() -> OpenApiRouter {
    let mut router = OpenApiRouter::new()
        .routes(routes!(get_places))
        .routes(routes!(query_places))
        .routes(routes!(create_place))
        .routes(routes!(get_place))
        .routes(routes!(update_place))
        .routes(routes!(delete_place));

    let openapi = router.get_openapi_mut();
    let mut tag = Tag::new("Place");
    tag.description = Some("Place crud endpoints".to_string());
    openapi.tags = Some(vec![tag]);
    router
}

#[utoipa::path(
    get,
    path = "/",
    tag = "Place",
    summary = "Search and Retrieve places",
    responses((status = 200, content_type = "application/json"))
)]
async fn get_places() -> String {
    "Get Places".to_string()
}

#[utoipa::path(
    post,
    path = "/query",
    tag = "Place",
    summary = "Search and Retrieve places",
    responses((status = 200, content_type = "application/json"))
)]
async fn query_places(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(
    post, 
    path = "/", 
    tag = "Place", 
    summary = "Place Creation", 
    responses((status = 200, content_type = "application/json"))
)]
async fn create_place(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(
    get,
    path = "/{id}",
    tag = "Place",
    summary = "Search and Retrieve place by id",
    responses((status = 200, content_type = "application/json"))
)]
async fn get_place(Path(id): Path<String>) -> String {
    format!("returning place {}", id)
}

#[utoipa::path(
    put, 
    path = "/{id}", 
    tag = "Place", 
    summary = "Update places", 
    responses((status = 200, content_type = "application/json"))
)]
async fn update_place(
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    println!("{}", id);
    Json(body)
}

#[utoipa::path(
    delete,
    path = "/{id}",
    tag = "Place",
    summary = "Delete place by id",
    responses((status = 200, content_type = "application/json"))
)]
async fn delete_place(Path(id): Path<String>) -> String {
    format!("Deleted place {}", id)
}

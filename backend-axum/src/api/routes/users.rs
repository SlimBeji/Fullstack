use axum::{Json, extract::Path};
use serde_json::Value;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

pub const PATH: &str = "/users";

pub fn routes() -> OpenApiRouter {
    let mut router = OpenApiRouter::new()
        .routes(routes!(get_users))
        .routes(routes!(query_users))
        .routes(routes!(create_user))
        .routes(routes!(get_user))
        .routes(routes!(update_user))
        .routes(routes!(delete_user));

    let openapi = router.get_openapi_mut();
    let mut tag = Tag::new("User");
    tag.description = Some("User crud endpoints".to_string());
    openapi.tags = Some(vec![tag]);
    router
}

#[utoipa::path(
    get,
    path = "/",
    tag = "User",
    summary = "Search and Retrieve users",
    responses((status = 200, content_type = "application/json"))
)]
async fn get_users() -> String {
    "Get Users".to_string()
}

#[utoipa::path(
    post,
    path = "/query",
    tag = "User",
    summary = "Search and Retrieve users",
    responses((status = 200, content_type = "application/json"))
)]
async fn query_users(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(
    post,
    path = "/", 
    tag = "User", 
    summary = "User Creation", 
    responses((status = 200, content_type = "application/json"))
)]
async fn create_user(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(
    get,
    path = "/{id}",
    tag = "User",
    summary = "Search and Retrieve user by id",
    responses((status = 200, content_type = "application/json"))
)]
async fn get_user(Path(id): Path<String>) -> String {
    format!("returning user {}", id)
}

#[utoipa::path(
    put,
    path = "/{id}", 
    tag = "User", 
    summary = "Update users",
    responses((status = 200, content_type = "application/json"))
)]
async fn update_user(
    Path(id): Path<String>,
    Json(body): Json<Value>,
) -> Json<Value> {
    println!("{}", id);
    Json(body)
}

#[utoipa::path(
    delete,
    path = "/{id}",
    tag = "User",
    summary = "Delete user by id",
    responses((status = 200, content_type = "application/json"))
)]
async fn delete_user(Path(id): Path<String>) -> String {
    format!("Deleted user {}", id)
}

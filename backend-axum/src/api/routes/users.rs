use axum::{Json, extract::Path, http::StatusCode, response::IntoResponse};
use serde_json::{Value, json};
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    lib_::axum_::{Validated, ValidatedJson},
    models::schemas::{UserPost, UserPostSwagger, UserPut, UserRead},
};

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
    responses((status = 200, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn get_users() -> String {
    "Get Users".to_string()
}

#[utoipa::path(
    post,
    path = "/query",
    tag = "User",
    summary = "Search and Retrieve users",
    responses((status = 200, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn query_users(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
}

#[utoipa::path(
    post,
    path = "/",
    tag = "User",
    summary = "User Creation",
    request_body(
        content = UserPostSwagger,
        content_type = "multipart/form-data"
    ),
    responses((
        status = 200,
        body = UserRead,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn create_user(
    Validated(payload): Validated<UserPost>,
) -> impl IntoResponse {
    println!("{:?}", payload.name);
    println!("{:?}", payload.email);
    println!("{:?}", payload.is_admin);
    println!("{:?}", payload.password);
    match payload.image {
        Some(image) => {
            println!("{}", image.originalname);
            println!("{}", image.mimetype);
            println!("{}", image.data.len());
        }
        _ => (),
    }
    let response = UserRead::example();
    (StatusCode::OK, Json(response))
}

#[utoipa::path(
    get,
    path = "/{id}",
    tag = "User",
    summary = "Search and Retrieve user by id",
    params(("id" = String, Path, description = "User ID")),
    responses((status = 200, body = UserRead, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn get_user(Path(id): Path<String>) -> impl IntoResponse {
    println!("returning user {}", id);
    (StatusCode::OK, Json(UserRead::example()))
}

#[utoipa::path(
    put,
    path = "/{id}",
    tag = "User",
    summary = "Update users",
    params(("id" = String, Path, description = "User ID")),
    request_body(
        content = UserPut,
        content_type = "application/json"
    ),
    responses((status = 200, body = UserRead, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn update_user(
    Path(id): Path<String>,
    ValidatedJson(payload): ValidatedJson<UserPut>,
) -> impl IntoResponse {
    println!("{}", id);
    println!("{:?}", payload.name);
    println!("{:?}", payload.email);
    println!("{:?}", payload.password);
    let response = UserRead::example();
    (StatusCode::OK, Json(response))
}

#[utoipa::path(
    delete,
    path = "/{id}",
    tag = "User",
    summary = "Delete user by id",
    params(("id" = String, Path, description = "User ID")),
    responses((
        status = 200,
        content_type = "application/json",
        example = json!({
            "message": "Deleted user 683b21134e2e5d46978daf1f"
        })
    )),
    security(("OAuth2Password" = []))
)]
async fn delete_user(Path(id): Path<String>) -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(json!({"message": format!("Deleted user {}", id)})),
    )
}

use axum::{Json, extract::Path, http::StatusCode, response::IntoResponse};
use serde_json::json;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    api::middlewares::Auth,
    models::schemas::{
        UserPost, UserPostSwagger, UserPut, UserRead, UserSearch,
        UsersPaginated,
    },
};
use backend::axum_::{BodyFilters, QueryFilters, Validated, ValidatedJson};

pub const PATH: &str = "/users";

pub fn routes() -> OpenApiRouter {
    let mut router = OpenApiRouter::new()
        .routes(routes!(get_users))
        .routes(routes!(search_users))
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
    params(UserSearch),
    responses((
        status = 200,
        body = UsersPaginated,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn get_users(
    Auth(user): Auth,
    data: QueryFilters<UserSearch>,
) -> impl IntoResponse {
    println!("{}", user.name);
    println!("{:?}", data.query.select);
    println!("{:?}", data.query.order_by);
    println!("{:?}", data.query.where_);
    let result = UsersPaginated {
        page: data.query.page,
        total_count: data.query.size,
        total_pages: 1,
        data: vec![UserRead::example()],
    };
    (StatusCode::OK, Json(result))
}

#[utoipa::path(
    post,
    path = "/search",
    tag = "User",
    summary = "Search and Retrieve users",
    request_body(
        content = UserSearch,
        content_type = "application/json"
    ),
    responses((
        status = 200,
        body = UsersPaginated,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn search_users(
    Auth(user): Auth,
    data: BodyFilters<UserSearch>,
) -> impl IntoResponse {
    println!("{}", user.name);
    println!("{:?}", data.query.select);
    println!("{:?}", data.query.order_by);
    println!("{:?}", data.query.where_);
    let result = UsersPaginated {
        page: data.query.page,
        total_count: data.query.size,
        total_pages: 1,
        data: vec![UserRead::example()],
    };
    (StatusCode::OK, Json(result))
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
    Auth(user): Auth,
    Validated(payload): Validated<UserPost>,
) -> impl IntoResponse {
    println!("{}", user.name);
    println!("{:?}", payload.name);
    println!("{:?}", payload.email);
    println!("{:?}", payload.is_admin);
    println!("{:?}", payload.password);
    if let Some(image) = payload.image {
        println!("{}", image.originalname);
        println!("{}", image.mimetype);
        println!("{}", image.data.len());
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
async fn get_user(
    Auth(user): Auth,
    Path(id): Path<String>,
) -> impl IntoResponse {
    println!("{}", user.name);
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
    Auth(user): Auth,
    Path(id): Path<String>,
    ValidatedJson(payload): ValidatedJson<UserPut>,
) -> impl IntoResponse {
    println!("{}", user.name);
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
async fn delete_user(
    Auth(user): Auth,
    Path(id): Path<String>,
) -> impl IntoResponse {
    println!("{}", user.name);
    (
        StatusCode::OK,
        Json(json!({"message": format!("Deleted user {}", id)})),
    )
}

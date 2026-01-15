use axum::{
    Json,
    extract::{Path, Query},
    http::StatusCode,
    response::IntoResponse,
};
use serde_json::json;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    api::middlewares::Auth,
    lib_::axum_::{Validated, ValidatedJson},
    models::schemas::{
        PlaceFilters, PlacePost, PlacePostSwagger, PlacePut, PlaceRead,
        PlacesPaginated, UserRead,
    },
};

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
    params(PlaceFilters),
    responses((
        status = 200,
        body = PlacesPaginated,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn get_places(
    Query(filters): Query<PlaceFilters>,
    Auth(user): Auth,
) -> impl IntoResponse {
    println!("{}", user.name);
    let data = PlacesPaginated {
        page: filters.page.unwrap_or(1),
        total_count: filters.size.unwrap_or(100),
        total_pages: 1,
        data: vec![PlaceRead::example()],
    };
    (StatusCode::OK, Json(data))
}

#[utoipa::path(
    post,
    path = "/query",
    tag = "Place",
    summary = "Search and Retrieve places",
    request_body(
        content = PlaceFilters,
        content_type = "application/json"
    ),
    responses((
        status = 200,
        body = PlacesPaginated,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn query_places(
    Auth(user): Auth,
    Json(filters): Json<PlaceFilters>,
) -> impl IntoResponse {
    println!("{}", user.name);
    let data = PlacesPaginated {
        page: filters.page.unwrap_or(1),
        total_count: filters.size.unwrap_or(100),
        total_pages: 1,
        data: vec![PlaceRead::example()],
    };
    (StatusCode::OK, Json(data))
}

#[utoipa::path(
    post,
    path = "/",
    tag = "Place",
    summary = "Place Creation",
    request_body(
        content = PlacePostSwagger,
        content_type = "multipart/form-data"
    ),
    responses((
        status = 200,
        body = PlaceRead,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn create_place(
    Auth(user): Auth,
    Validated(payload): Validated<PlacePost>,
) -> impl IntoResponse {
    println!("{}", user.name);
    println!("{:?}", payload.title);
    println!("{:?}", payload.description);
    println!("{:?}", payload.address);
    println!("{:?}", payload.lat);
    println!("{:?}", payload.lng);
    println!("{:?}", payload.creator_id);
    match payload.image {
        Some(image) => {
            println!("{}", image.originalname);
            println!("{}", image.mimetype);
            println!("{}", image.data.len());
        }
        _ => (),
    }
    let response = PlaceRead::example();
    (StatusCode::OK, Json(response))
}

#[utoipa::path(
    get,
    path = "/{id}",
    tag = "Place",
    summary = "Search and Retrieve place by id",
    params(("id" = String, Path, description = "Place ID")),
    responses((status = 200, body = PlaceRead, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn get_place(
    Auth(user): Auth,
    Path(id): Path<String>,
) -> impl IntoResponse {
    println!("{}", user.name);
    println!("returning place {}", id);
    (StatusCode::OK, Json(PlaceRead::example()))
}

#[utoipa::path(
    put,
    path = "/{id}",
    tag = "Place",
    summary = "Update places",
    params(("id" = String, Path, description = "Place ID")),
    request_body(
        content = PlacePut,
        content_type = "application/json"
    ),
    responses((status = 200, body = PlaceRead, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn update_place(
    Auth(user): Auth,
    Path(id): Path<String>,
    ValidatedJson(payload): ValidatedJson<PlacePut>,
) -> impl IntoResponse {
    println!("{}", user.name);
    println!("{}", id);
    println!("{:?}", payload.title);
    println!("{:?}", payload.description);
    println!("{:?}", payload.address);
    println!("{:?}", payload.location);
    println!("{:?}", payload.creator_id);
    (StatusCode::OK, Json(UserRead::example()))
}

#[utoipa::path(
    delete,
    path = "/{id}",
    tag = "Place",
    summary = "Delete place by id",
    params(("id" = String, Path, description = "Pace ID")),
    responses((
        status = 200,
        content_type = "application/json",
        example = json!({
            "message": "Deleted place 683b21134e2e5d46978daf1f"
        })
    )),
    security(("OAuth2Password" = []))
)]
async fn delete_place(
    Auth(user): Auth,
    Path(id): Path<String>,
) -> impl IntoResponse {
    println!("{}", user.name);
    (
        StatusCode::OK,
        Json(json!({"message": format!("Deleted place {}", id)})),
    )
}

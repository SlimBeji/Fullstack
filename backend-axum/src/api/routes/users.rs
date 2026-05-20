use axum::extract::State;
use axum::{Json, extract::Path};
use serde_json::{Value, json};
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::middlewares::Auth;
use crate::lib_::seaorm_::{Create, Delete, Read, Search, Update};
use crate::lib_::types_::ApiError;
use crate::lib_::{
    axum_::{BodyFilters, Query, QueryFilters, Validated, ValidatedJson},
    types_::PaginatedData,
};
use crate::models::cruds::{CrudsUser, UserOptions};
use crate::models::schemas::{UserGet, UserPost, UserPostSwagger, UserPut, UserRead, UserSearch};
use crate::services::SharedState;

pub const PATH: &str = "/users";

pub fn routes() -> OpenApiRouter<SharedState> {
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
        body = PaginatedData<UserRead>,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn get_users(
    State(state): State<SharedState>,
    Auth(_): Auth,
    search: QueryFilters<UserSearch>,
) -> Result<Json<PaginatedData<Value>>, ApiError> {
    let options = UserOptions {
        process: Some(true),
        ..Default::default()
    };
    let cruds = CrudsUser::new(state);
    Ok(Json(cruds.paginate(search.query, Some(options)).await?))
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
        body = PaginatedData<UserRead>,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn search_users(
    State(state): State<SharedState>,
    Auth(_): Auth,
    search: BodyFilters<UserSearch>,
) -> Result<Json<PaginatedData<Value>>, ApiError> {
    let options = UserOptions {
        process: Some(true),
        ..Default::default()
    };
    let cruds = CrudsUser::new(state);
    Ok(Json(cruds.paginate(search.query, Some(options)).await?))
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
    State(state): State<SharedState>,
    Auth(user): Auth,
    Validated(payload): Validated<UserPost>,
) -> Result<Json<UserRead>, ApiError> {
    let options = UserOptions {
        process: Some(true),
        ..Default::default()
    };
    let cruds = CrudsUser::new(state);
    Ok(Json(cruds.user_post(&user, payload, Some(options)).await?))
}

#[utoipa::path(
    get,
    path = "/{id}",
    tag = "User",
    summary = "Search and Retrieve user by id",
    params(("id" = String, Path, description = "User ID"), UserGet),
    responses((status = 200, body = UserRead, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn get_user(
    State(state): State<SharedState>,
    Auth(_): Auth,
    Path(id): Path<u32>,
    Query(params): Query<UserGet>,
) -> Result<Json<Value>, ApiError> {
    let options = UserOptions {
        process: Some(true),
        fields: params.fields,
    };
    let cruds = CrudsUser::new(state);
    Ok(Json(cruds.get_partial(id, Some(options)).await?))
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
    State(state): State<SharedState>,
    Auth(user): Auth,
    Path(id): Path<u32>,
    ValidatedJson(payload): ValidatedJson<UserPut>,
) -> Result<Json<UserRead>, ApiError> {
    let options = UserOptions {
        process: Some(true),
        ..Default::default()
    };
    let cruds = CrudsUser::new(state);
    Ok(Json(
        cruds.user_put(&user, id, payload, Some(options)).await?,
    ))
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
    State(state): State<SharedState>,
    Auth(user): Auth,
    Path(id): Path<u32>,
) -> Result<Json<Value>, ApiError> {
    let cruds = CrudsUser::new(state);
    cruds.user_delete(&user, id).await?;
    println!("{}", user.name);
    Ok(Json(json!({"message": format!("Deleted user {}", id)})))
}

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
use crate::models::cruds::{CrudsPlace, PlaceOptions};
use crate::models::schemas::{
    PlaceGet, PlacePost, PlacePostSwagger, PlacePut, PlaceRead, PlaceSearch,
};
use crate::services::SharedState;

pub const PATH: &str = "/places/";

pub fn routes() -> OpenApiRouter<SharedState> {
    let mut router = OpenApiRouter::new()
        .routes(routes!(get_places))
        .routes(routes!(search_places))
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
    params(PlaceSearch),
    responses((
        status = 200,
        body = PaginatedData<PlaceRead>,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn get_places(
    State(state): State<SharedState>,
    Auth(_): Auth,
    data: QueryFilters<PlaceSearch>,
) -> Result<Json<PaginatedData<Value>>, ApiError> {
    let options = PlaceOptions {
        process: Some(true),
        ..Default::default()
    };
    let cruds = CrudsPlace::new(state);
    Ok(Json(cruds.paginate(data.query, Some(options)).await?))
}

#[utoipa::path(
    post,
    path = "/search",
    tag = "Place",
    summary = "Search and Retrieve places",
    request_body(
        content = PlaceSearch,
        content_type = "application/json"
    ),
    responses((
        status = 200,
        body = PaginatedData<PlaceRead>,
        content_type = "application/json"
    )),
    security(("OAuth2Password" = []))
)]
async fn search_places(
    State(state): State<SharedState>,
    Auth(_): Auth,
    data: BodyFilters<PlaceSearch>,
) -> Result<Json<PaginatedData<Value>>, ApiError> {
    let options = PlaceOptions {
        process: Some(true),
        ..Default::default()
    };
    let cruds = CrudsPlace::new(state);
    Ok(Json(cruds.paginate(data.query, Some(options)).await?))
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
    State(state): State<SharedState>,
    Auth(user): Auth,
    Validated(payload): Validated<PlacePost>,
) -> Result<Json<PlaceRead>, ApiError> {
    let options = PlaceOptions {
        process: Some(false),
        ..Default::default()
    };
    let cruds = CrudsPlace::new(state);
    Ok(Json(cruds.user_post(&user, payload, Some(options)).await?))
}

#[utoipa::path(
    get,
    path = "/{id}",
    tag = "Place",
    summary = "Search and Retrieve place by id",
    params(("id" = String, Path, description = "Place ID"), PlaceGet),
    responses((status = 200, body = PlaceRead, content_type = "application/json")),
    security(("OAuth2Password" = []))
)]
async fn get_place(
    State(state): State<SharedState>,
    Auth(_): Auth,
    Path(id): Path<u32>,
    Query(params): Query<PlaceGet>,
) -> Result<Json<Value>, ApiError> {
    let options = PlaceOptions {
        process: Some(false),
        fields: params.fields,
    };
    let cruds = CrudsPlace::new(state);
    Ok(Json(cruds.get_partial(id, Some(options)).await?))
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
    State(state): State<SharedState>,
    Auth(user): Auth,
    Path(id): Path<u32>,
    ValidatedJson(payload): ValidatedJson<PlacePut>,
) -> Result<Json<PlaceRead>, ApiError> {
    let options = PlaceOptions {
        process: Some(false),
        ..Default::default()
    };
    let cruds = CrudsPlace::new(state);
    Ok(Json(
        cruds.user_put(&user, id, payload, Some(options)).await?,
    ))
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
    State(state): State<SharedState>,
    Auth(user): Auth,
    Path(id): Path<u32>,
) -> Result<Json<Value>, ApiError> {
    let cruds = CrudsPlace::new(state);
    cruds.user_delete(&user, id).await?;
    Ok(Json(json!({"message": format!("Deleted place {}", id)})))
}

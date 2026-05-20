use axum::extract::State;
use axum::{Json, response::IntoResponse};
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::lib_::axum_::{Validated, ValidatedForm};
use crate::lib_::types_::ApiError;
use crate::models::cruds::CrudsUser;
use crate::models::schemas::{EncodedToken, SigninSchema, SignupSchema, SignupSchemaSwagger};
use crate::services::SharedState;

pub const PATH: &str = "/auth";

pub fn routes() -> OpenApiRouter<SharedState> {
    let mut router = OpenApiRouter::new()
        .routes(routes!(signup_route))
        .routes(routes!(signin_route));

    let openapi = router.get_openapi_mut();
    let mut tag = Tag::new("Auth");
    tag.description = Some("Registration and Authentication endpoints".to_string());
    openapi.tags = Some(vec![tag]);
    router
}

#[utoipa::path(
    post,
    path = "/signup",
    tag = "Auth",
    summary = "User registration",
    request_body(
        content = SignupSchemaSwagger,
        content_type = "multipart/form-data"
    ),
    responses((
        status = 200,
        body=EncodedToken,
        content_type = "application/json"
    ))
)]
async fn signup_route(
    State(state): State<SharedState>,
    Validated(payload): Validated<SignupSchema>,
) -> Result<impl IntoResponse, ApiError> {
    let cruds = CrudsUser::new(state);
    Ok(Json(cruds.signup(payload).await?))
}

#[utoipa::path(
    post,
    path = "/signin",
    tag = "Auth",
    summary = "User authentication",
    request_body(
        content = SigninSchema,
        content_type = "application/x-www-form-urlencoded"
    ),
    responses((
        status = 200,
        body=EncodedToken,
        content_type = "application/json"
    ))
)]
async fn signin_route(
    State(state): State<SharedState>,
    ValidatedForm(payload): ValidatedForm<SigninSchema>,
) -> Result<impl IntoResponse, ApiError> {
    let cruds = CrudsUser::new(state);
    Ok(Json(cruds.signin(payload).await?))
}

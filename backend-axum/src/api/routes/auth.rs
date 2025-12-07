use axum::{Json, http::StatusCode};
use axum::extract::Form;
use axum::response::IntoResponse;
use serde_json::Value;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::models::schemas::auth::{SigninSchema, EncodedTokenSchema};

pub const PATH: &str = "/auth";

pub fn routes() -> OpenApiRouter {
    let mut router = OpenApiRouter::new()
        .routes(routes!(signup_route))
        .routes(routes!(signin_route));

    let openapi = router.get_openapi_mut();
    let mut tag = Tag::new("Auth");
    tag.description =
        Some("Registration and Authentication endpoints".to_string());
    openapi.tags = Some(vec![tag]);
    router
}

#[utoipa::path(
    post,
    path = "/signup",
    tag = "Auth",
    summary = "User registration",
    responses((status = 200, content_type = "application/json"))
)]
async fn signup_route(Json(body): Json<Value>) -> Json<Value> {
    Json(body)
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
        body=EncodedTokenSchema, 
        content_type = "application/json"
    ))
)]
async fn signin_route(Form(payload): Form<SigninSchema>) -> impl IntoResponse {
    println!("{:?}", payload);
    let response = EncodedTokenSchema::example();
    (StatusCode::OK, Json(response))
}

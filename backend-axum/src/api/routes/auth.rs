use axum::{Json, extract::Form, http::StatusCode, response::IntoResponse};
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::models::schemas::{
    EncodedTokenSchema, SigninSchema, SignupSchema, SignupSchemaSwagger,
};

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
    request_body(
        content = SignupSchemaSwagger,
        content_type = "multipart/form-data"
    ),
    responses((
        status = 200,
        body=EncodedTokenSchema,
        content_type = "application/json"
    ))
)]
async fn signup_route(payload: SignupSchema) -> impl IntoResponse {
    println!("{:?}", payload.name);
    println!("{:?}", payload.email);
    println!("{:?}", payload.password);
    match payload.image {
        Some(image) => {
            println!("{}", image.originalname);
            println!("{}", image.mimetype);
            println!("{}", image.data.len());
        }
        _ => (),
    }
    let response = EncodedTokenSchema::example();
    (StatusCode::OK, Json(response))
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

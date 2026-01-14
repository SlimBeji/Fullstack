use axum::{Json, response::IntoResponse};
use serde_json::json;
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::middlewares::Auth;

pub const PATH: &str = "/hello-world";

pub fn routes() -> OpenApiRouter {
    let mut router = OpenApiRouter::new()
        .routes(routes!(hello))
        .routes(routes!(hello_user))
        .routes(routes!(hello_admin));

    let openapi = router.get_openapi_mut();
    let mut tag = Tag::new("Hello World");
    tag.description = Some("Hello World endpoints".to_string());
    openapi.tags = Some(vec![tag]);
    router
}

#[utoipa::path(
    get,
    path = "/",
    tag = "Hello World",
    summary = "Hello World Endpoint",
    responses((
        status = 200,
        content_type = "application/json",
        example = json!({
            "message": "Hello World!"
        })
    ))
)]
async fn hello() -> impl IntoResponse {
    Json(json!({
        "message": "Hello World!"
    }))
}

#[utoipa::path(
    get,
    path = "/user",
    tag = "Hello World",
    summary = "Hello World Endpoint for authenticated users",
    responses((
        status = 200,
        content_type = "application/json",
        example = json!({
            "message": "Hello Slim Beji!"
        })
    )),
    security(("OAuth2Password" = []))
)]
async fn hello_user(Auth(user): Auth) -> impl IntoResponse {
    Json(json!({
        "message": format!("Hello {}!", user.name)
    }))
}

#[utoipa::path(
    get,
    path = "/admin",
    tag = "Hello World",
    summary = "Hello World Endpoint for admins only",
    responses((
        status = 200,
        content_type = "application/json",
        example = json!({
            "message": "Hello Slim Beji!"
        })
    )),
    security(("OAuth2Password" = []))
)]
async fn hello_admin(Auth(user): Auth) -> impl IntoResponse {
    Json(json!({
        "message": format!("Hello Admin {}!", user.name)
    }))
}

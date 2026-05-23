use axum::Json;
use axum::extract::State;
use serde_json::{Value, json};
use utoipa::openapi::Tag;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::middlewares::{Admin, Auth};
use crate::background::publishers;
use crate::lib_::types_::ApiError;
use crate::services::SharedState;

pub const PATH: &str = "/hello-world";

pub fn routes() -> OpenApiRouter<SharedState> {
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
async fn hello(State(state): State<SharedState>) -> Result<Json<Value>, ApiError> {
    publishers::send_newsletter(
        &state.publisher,
        "Slim".to_string(),
        "mslimbeji@gmail.com".to_string(),
    )
    .await?;
    Ok(Json(json!({
        "message": "Hello World!"
    })))
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
async fn hello_user(Auth(user): Auth) -> Json<Value> {
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
            "message": "Hello Admin Slim Beji!"
        })
    )),
    security(("OAuth2Password" = []))
)]
async fn hello_admin(Admin(user): Admin) -> Json<Value> {
    Json(json!({
        "message": format!("Hello Admin {}!", user.name)
    }))
}

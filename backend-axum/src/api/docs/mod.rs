use axum::Router;
use utoipa::openapi::InfoBuilder;
use utoipa::openapi::security::{
    Flow, OAuth2, Password, Scopes, SecurityScheme,
};
use utoipa::openapi::server::ServerBuilder;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

use crate::config;

pub fn add_swagger_ui(app: OpenApiRouter) -> Router {
    let (router, mut openapi) = app.split_for_parts();
    openapi.info = InfoBuilder::new()
        .title("My Axum API")
        .version("1.0.0")
        .description(Some(
            "API documentation for my Axum application using Swagger UI",
        ))
        .build();

    openapi.servers = Some(vec![
        ServerBuilder::new()
            .url(config::ENV.server_url())
            .description(Some("Swagger documentation"))
            .build(),
    ]);

    openapi.components.as_mut().unwrap().add_security_scheme(
        "OAuth2Password",
        SecurityScheme::OAuth2(OAuth2::new([Flow::Password(Password::new(
            "/api/auth/signin",
            Scopes::new(),
        ))])),
    );

    Router::new()
        .merge(router)
        .merge(SwaggerUi::new("/swagger-ui").url("/openapi.json", openapi))
}

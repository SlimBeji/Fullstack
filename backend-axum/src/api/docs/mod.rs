use axum::Router;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

pub fn add_swagger_ui(app: OpenApiRouter) -> Router {
    let (router, openapi) = app.split_for_parts();
    Router::new()
        .merge(router)
        .merge(SwaggerUi::new("/swagger-ui").url("/openapi.json", openapi))
}

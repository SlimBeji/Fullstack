use axum::Router;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;

use crate::config;

mod docs;
mod middlewares;
mod routes;

pub fn get_app() -> Router {
    let router = routes::create_router("/api");
    let app = docs::add_swagger_ui(router);
    let app = add_trace_layer(app);
    app.layer(middlewares::cors::cors_layer())
}

fn add_trace_layer(router: Router) -> Router {
    tracing_subscriber::fmt()
        .with_max_level(config::ENV.trace_lvl())
        .with_target(false)
        .init();

    router.layer(ServiceBuilder::new().layer(
        TraceLayer::new_for_http().make_span_with(
            |request: &axum::http::Request<_>| {
                tracing::info_span!(
                    "request",
                    method = %request.method(),
                    uri = %request.uri(),
                )
            },
        ),
    ))
}

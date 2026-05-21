use axum::http::{HeaderName, HeaderValue, Method};
use tower_http::cors::{Any, CorsLayer};

use crate::config;

pub fn cors_layer() -> CorsLayer {
    let layer = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::header::ORIGIN,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::ACCEPT,
            axum::http::header::AUTHORIZATION,
            HeaderName::from_static("x-requested-with"),
        ]);

    if config::ENV.app_url == "*" {
        layer.allow_origin(Any)
    } else {
        layer.allow_origin(
            HeaderValue::from_str(&config::ENV.app_url).expect("not a valid allow origin value"),
        )
    }
}

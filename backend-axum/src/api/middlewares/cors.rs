use axum::http::{HeaderName, HeaderValue, Method};
use tower_http::cors::CorsLayer;

use crate::config;

pub fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(
            HeaderValue::from_str(&config::ENV.app_url)
                .expect("not a valid allow origin value"),
        )
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
        ])
}

use axum::{http::StatusCode, response::IntoResponse};
use serde_json::Value;

use crate::types_::ApiError;

pub async fn url_not_found(uri: axum::http::Uri) -> impl IntoResponse {
    ApiError {
        code: StatusCode::NOT_FOUND,
        message: "wrong endpoint".into(),
        details: Some(Value::String(uri.to_string())),
        err: None,
    }
}

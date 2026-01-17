use std::fmt;

use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use serde_json::{Error as SerdeErr, Value, error::Category, json};
use std::error::Error;

pub struct ApiError {
    pub code: StatusCode,
    pub message: String,
    pub details: Option<Value>,
    pub err: Option<Box<dyn Error + Send + Sync>>,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body =
            Json(json!({"error": self.message, "details": self.details}));
        (self.code, body).into_response()
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{}",
            format!("Error {} - {}", self.code.as_str(), self.message)
        )
    }
}

impl fmt::Debug for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("ApiError")
            .field("code", &self.code)
            .field("message", &self.message)
            .field("details", &self.details)
            .field("err", &self.err)
            .finish()
    }
}

impl Error for ApiError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        self.err
            .as_ref()
            .map(|e| e.as_ref() as &(dyn Error + 'static))
    }
}

impl From<SerdeErr> for ApiError {
    fn from(raw: SerdeErr) -> Self {
        match raw.classify() {
            Category::Data => Self {
                code: StatusCode::UNPROCESSABLE_ENTITY,
                message: "Invalid JSON data".to_string(),
                details: Some(Value::String(raw.to_string())),
                err: Some(Box::new(raw)),
            },
            _ => Self {
                code: StatusCode::BAD_REQUEST,
                message: "JSON could not be parsed".to_string(),
                details: Some(Value::String(raw.to_string())),
                err: Some(Box::new(raw)),
            },
        }
    }
}

#[allow(dead_code)] // to be removed
impl ApiError {
    pub fn unprocessable(
        message: impl Into<String>,
        details: Option<Value>,
    ) -> Self {
        Self {
            code: StatusCode::UNPROCESSABLE_ENTITY,
            message: message.into(),
            details,
            err: None,
        }
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self {
            code: StatusCode::BAD_REQUEST,
            message: message.into(),
            details: None,
            err: None,
        }
    }

    pub fn internal_error<E: Error + Send + Sync + 'static>(
        message: impl Into<String>,
        e: Option<E>,
    ) -> Self {
        Self {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: message.into(),
            details: None,
            err: e.map(|err| Box::new(err) as Box<dyn Error + Send + Sync>),
        }
    }
}

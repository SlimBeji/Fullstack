use std::fmt;

use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use validator::{Validate, ValidationErrors};

use serde_json::{Error as SerdeErr, Value, error::Category, json};
use std::error::Error;

use super::super::validator_::errors_to_serde_map;

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
        write!(f, "Error {} - {}", self.code.as_str(), self.message)
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
    pub fn validate<T: Validate>(inner: &T) -> Result<(), Self> {
        inner.validate().map_err(|e| Self {
            code: StatusCode::UNPROCESSABLE_ENTITY,
            message: "invalid data".to_string(),
            details: Some(Value::Object(errors_to_serde_map(&e))),
            err: Some(Box::new(e)),
        })?;
        Ok(())
    }

    pub fn from_validation_errors(
        message: impl Into<String>,
        errors: ValidationErrors,
    ) -> Self {
        Self {
            code: StatusCode::UNPROCESSABLE_ENTITY,
            message: message.into(),
            details: Some(Value::Object(errors_to_serde_map(&errors))),
            err: Some(Box::new(errors)),
        }
    }

    pub fn unprocessable(
        message: impl Into<String>,
        details: Option<Value>,
        err: Option<Box<dyn Error + Send + Sync>>,
    ) -> Self {
        let details =
            details.or(err.as_ref().map(|e| Value::String(e.to_string())));

        Self {
            code: StatusCode::UNPROCESSABLE_ENTITY,
            message: message.into(),
            details,
            err,
        }
    }

    pub fn bad_form_data(
        detail: impl Into<String>,
        err: Box<dyn Error + Send + Sync>,
    ) -> Self {
        let message = detail.into();
        let (msg, info) = message
            .split_once(":")
            .unwrap_or(("bad form data", message.as_str()));
        Self {
            code: StatusCode::UNPROCESSABLE_ENTITY,
            message: msg.to_string(),
            details: Some(Value::String(info.to_string())),
            err: Some(err),
        }
    }

    pub fn bad_auth_header(detail: impl Into<String>) -> Self {
        Self {
            code: StatusCode::BAD_REQUEST,
            message: "bad Authorization header".to_string(),
            details: Some(Value::String(detail.into())),
            err: None,
        }
    }

    pub fn bad_request(
        message: impl Into<String>,
        err: Box<dyn Error + Send + Sync>,
    ) -> Self {
        Self {
            code: StatusCode::BAD_REQUEST,
            message: message.into(),
            details: Some(Value::String(err.to_string())),
            err: Some(err),
        }
    }

    pub fn bad_multipart_field(field: &str, detail: impl Into<String>) -> Self {
        Self {
            code: StatusCode::BAD_REQUEST,
            message: format!("bad field {}", field),
            details: Some(Value::String(detail.into())),
            err: None,
        }
    }

    pub fn multipart_parsing_error(
        message: impl Into<String>,
        err: Box<dyn Error + Send + Sync>,
    ) -> Self {
        Self {
            code: StatusCode::BAD_REQUEST,
            message: message.into(),
            details: Some(Value::String(err.to_string())),
            err: Some(err),
        }
    }

    pub fn internal_error(
        message: impl Into<String>,
        err: Box<dyn Error + Send + Sync>,
    ) -> Self {
        Self {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: message.into(),
            details: Some(Value::String(err.to_string())),
            err: Some(err),
        }
    }
}

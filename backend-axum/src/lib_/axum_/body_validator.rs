use axum::extract::{Form, FromRequest, Request};
use serde::de::DeserializeOwned;
use serde_json::{Value, json};
use validator::{Validate, ValidationError, ValidationErrors};

use super::error::ApiError;

// Validated for types that impelments FromRequest with ApiError rejection
pub struct Validated<T>(pub T);

impl<T> std::ops::Deref for Validated<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<S, T> FromRequest<S> for Validated<T>
where
    S: Send + Sync,
    T: FromRequest<S, Rejection = ApiError> + Validate,
{
    type Rejection = ApiError;

    async fn from_request(
        req: Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let inner = T::from_request(req, state).await?;
        validate(&inner)?;
        Ok(Self(inner))
    }
}

// ValidatedForm for simple structs that implements only Validated trait
pub struct ValidatedForm<T>(pub T);

impl<T> std::ops::Deref for ValidatedForm<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<S, T> FromRequest<S> for ValidatedForm<T>
where
    S: Send + Sync,
    T: DeserializeOwned + Validate,
{
    type Rejection = ApiError;

    async fn from_request(
        req: Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        // need to undersatnd the internal error for a better bad request message ??

        let inner = Form::<T>::from_request(req, state)
            .await
            .map_err(|rejection| {
                // Check the error by its Display or Debug output
                let error_msg = rejection.to_string();

                if error_msg.contains("missing field")
                    || error_msg.contains("Failed to deserialize")
                {
                    ApiError::unprocessable(&error_msg, None)
                } else {
                    ApiError::bad_request(&format!(
                        "Invalid form data: {}",
                        error_msg
                    ))
                }
            })?
            .0;
        validate(&inner)?;
        Ok(Self(inner))
    }
}

// Common Helpers

fn validate<T: Validate>(inner: &T) -> Result<(), ApiError> {
    inner.validate().map_err(|e| {
        ApiError::unprocessable("invalid form", Some(field_errors_to_json(&e)))
    })
}

fn field_errors_to_json(e: &ValidationErrors) -> Value {
    let mut map = serde_json::Map::new();

    for (field, errors) in e.field_errors() {
        let arr: Vec<Value> = errors
            .iter()
            .map(|err: &ValidationError| {
                json!({
                    "code": err.code,
                    "message": err.message.clone().map(|m| m.to_string()),
                    "params": err.params,
                })
            })
            .collect();
        map.insert(field.to_string(), Value::Array(arr));
    }

    Value::Object(map)
}

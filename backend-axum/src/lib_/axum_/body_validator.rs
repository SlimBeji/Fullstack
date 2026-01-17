use axum::extract::{Form, FromRequest, Json, Request};
use serde::de::DeserializeOwned;
use validator::Validate;

use super::ApiError;

// Validated for types that impelments FromRequest with ApiError rejection
pub struct Validated<T>(pub T);

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
        ApiError::validate(&inner)?;
        Ok(Self(inner))
    }
}

// ValidatedJson for simple structs that implements only Validated trait
pub struct ValidatedJson<T>(pub T);

impl<S, T> FromRequest<S> for ValidatedJson<T>
where
    S: Send + Sync,
    T: DeserializeOwned + Validate,
{
    type Rejection = ApiError;

    async fn from_request(
        req: Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let inner = Json::<T>::from_request(req, state)
            .await
            .map_err(|rejection| {
                // Check the error by its Display or Debug output
                ApiError::bad_request("Invalid json data", Box::new(rejection))
            })?
            .0;
        ApiError::validate(&inner)?;
        Ok(Self(inner))
    }
}

// ValidatedForm for simple structs that implements only Validated trait
pub struct ValidatedForm<T>(pub T);

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
                    ApiError::serialization_err(error_msg, Box::new(rejection))
                } else {
                    ApiError::bad_request(
                        "Invalid form data",
                        Box::new(rejection),
                    )
                }
            })?
            .0;
        ApiError::validate(&inner)?;
        Ok(Self(inner))
    }
}

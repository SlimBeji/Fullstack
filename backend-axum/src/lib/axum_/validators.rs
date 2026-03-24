use axum::extract::{Form, FromRequest, Json, Request};
use serde::de::DeserializeOwned;
use validator::Validate;

use super::super::types_::ApiError;
use super::extract::Query;

// Validated for types that impelments FromRequest+Validate with ApiError rejection
// Used mainly for multipart/form-data endpoints
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

// ValidatedJson for simple structs that implements only Validate trait
// Used for application/json endpoints
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
            .map_err(ApiError::from_json_rejection)?
            .0;
        ApiError::validate(&inner)?;
        Ok(Self(inner))
    }
}

// ValidatedForm for simple structs that implements only Validated trait
// Used mainly for application/x-www-form-urlencoded endpoints
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
        let inner = Form::<T>::from_request(req, state)
            .await
            .map_err(ApiError::from_form_rejection)?
            .0;
        ApiError::validate(&inner)?;
        Ok(Self(inner))
    }
}

// ValidatedQuery for simple structs that implements only Validated trait
// Used mainly to parse query parameters
#[allow(dead_code)]
pub struct ValidatedQuery<T>(pub T);

impl<S, T> FromRequest<S> for ValidatedQuery<T>
where
    S: Sync + Send,
    T: DeserializeOwned + Validate,
{
    type Rejection = ApiError;

    async fn from_request(
        req: Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        // The custom Query from extractors is using ApiError as Rejection type
        let inner = Query::<T>::from_request(req, state).await?.0;
        ApiError::validate(&inner)?;
        Ok(Self(inner))
    }
}

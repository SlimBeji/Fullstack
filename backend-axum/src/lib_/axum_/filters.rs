use axum::extract::{FromRequest, Json};
use axum_extra::extract::Query;
use serde::de::DeserializeOwned;

use super::ApiError;

// Filters from Query parameters
pub struct QueryFilters<T>(pub T);

impl<S, T> FromRequest<S> for QueryFilters<T>
where
    S: Send + Sync,
    T: DeserializeOwned,
{
    type Rejection = ApiError;

    async fn from_request(
        req: axum::extract::Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let inner = Query::<T>::from_request(req, state)
            .await
            .map_err(|rejection| {
                ApiError::bad_request(
                    "bad query parameter",
                    Box::new(rejection),
                )
            })?
            .0;
        Ok(Self(inner))
    }
}

// Filters from JSON Body
pub struct BodyFilters<T>(pub T);

impl<S, T> FromRequest<S> for BodyFilters<T>
where
    S: Send + Sync,
    T: DeserializeOwned,
{
    type Rejection = ApiError;

    async fn from_request(
        req: axum::extract::Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let inner = Json::<T>::from_request(req, state)
            .await
            .map_err(|rejection| {
                ApiError::bad_request(
                    "Invalid body filters",
                    Box::new(rejection),
                )
            })?
            .0;
        Ok(Self(inner))
    }
}

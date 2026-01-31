use std::marker::PhantomData;

use axum::extract::{FromRequest, Json};
use axum_extra::extract::Query;
use serde::de::DeserializeOwned;

use super::super::types_::{FindQuery, ToFindQuery};
use super::ApiError;

// Filters from Query parameters
pub struct QueryFilters<T> {
    pub query: FindQuery,
    _marker: PhantomData<T>,
}

impl<S, T> FromRequest<S> for QueryFilters<T>
where
    S: Send + Sync,
    T: DeserializeOwned + ToFindQuery,
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
                    "bad query parameters",
                    Box::new(rejection),
                )
            })?
            .0;
        let find_query = inner.to_find_query().map_err(|errors| {
            ApiError::from_validation_errors("bad query parameters", errors)
        })?;
        Ok(Self {
            query: find_query,
            _marker: PhantomData,
        })
    }
}

// Filters from JSON Body
pub struct BodyFilters<T> {
    pub query: FindQuery,
    _marker: PhantomData<T>,
}

impl<S, T> FromRequest<S> for BodyFilters<T>
where
    S: Send + Sync,
    T: DeserializeOwned + ToFindQuery,
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
        let find_query = inner.to_find_query().map_err(|errors| {
            ApiError::from_validation_errors("bad query parameters", errors)
        })?;
        Ok(Self {
            query: find_query,
            _marker: PhantomData,
        })
    }
}

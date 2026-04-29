use std::marker::PhantomData;

use axum::extract::{FromRequest, Json};
use serde::de::DeserializeOwned;

use super::extract::Query;
use crate::lib_::types_::{ApiError, SearchQuery, ToSearchQuery};

// Filters from Query parameters
pub struct QueryFilters<T: ToSearchQuery> {
    pub query: SearchQuery<T::Selectable, T::Sortable>,
    _marker: PhantomData<T>,
}

impl<S, T> FromRequest<S> for QueryFilters<T>
where
    S: Send + Sync,
    T: DeserializeOwned + ToSearchQuery,
{
    type Rejection = ApiError;

    async fn from_request(req: axum::extract::Request, state: &S) -> Result<Self, Self::Rejection> {
        let inner = Query::<T>::from_request(req, state).await?.0;
        let find_query = inner
            .to_search_query()
            .map_err(|errors| ApiError::from_validation_errors("bad query parameters", errors))?;
        Ok(Self {
            query: find_query,
            _marker: PhantomData,
        })
    }
}

// Filters from JSON Body
pub struct BodyFilters<T: ToSearchQuery> {
    pub query: SearchQuery<T::Selectable, T::Sortable>,
    _marker: PhantomData<T>,
}

impl<S, T> FromRequest<S> for BodyFilters<T>
where
    S: Send + Sync,
    T: DeserializeOwned + ToSearchQuery,
{
    type Rejection = ApiError;

    async fn from_request(req: axum::extract::Request, state: &S) -> Result<Self, Self::Rejection> {
        let inner = Json::<T>::from_request(req, state)
            .await
            .map_err(ApiError::from_json_rejection)?
            .0;
        let find_query = inner
            .to_search_query()
            .map_err(|errors| ApiError::from_validation_errors("bad query parameters", errors))?;
        Ok(Self {
            query: find_query,
            _marker: PhantomData,
        })
    }
}

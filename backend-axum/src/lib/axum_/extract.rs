use axum::extract::FromRequest;
use axum_extra::extract::Query as AxumExtraQuery;
use serde::de::DeserializeOwned;

use crate::axum_::ApiError;

pub struct Query<T>(pub T);

impl<S, T> FromRequest<S> for Query<T>
where
    S: Send + Sync,
    T: DeserializeOwned,
{
    type Rejection = ApiError;

    async fn from_request(
        req: axum::extract::Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let inner = AxumExtraQuery::<T>::from_request(req, state)
            .await
            .map_err(ApiError::from_query_rejection)?
            .0;

        Ok(Self(inner))
    }
}

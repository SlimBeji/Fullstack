use crate::{lib_::axum_::ApiError, models::schemas::UserRead};
use axum::extract::FromRequestParts;

pub struct Auth(pub UserRead);

impl<S: Send + Sync> FromRequestParts<S> for Auth {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get("Authorization")
            .ok_or(ApiError::bad_auth_header("header missing"))?
            .to_str()
            .map_err(|_| ApiError::bad_auth_header("bad value"))?
            .strip_prefix("Bearer ")
            .ok_or(ApiError::bad_auth_header("not a Bearer token"))?;

        Ok(Self(get_user_from_token(token)))
    }
}

fn get_user_from_token(_bearer: &str) -> UserRead {
    UserRead::example()
}

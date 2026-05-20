use axum::extract::FromRequestParts;

use crate::lib_::types_::ApiError;
use crate::models::cruds::CrudsUser;
use crate::models::schemas::{TokenPayload, UserRead};
use crate::services::SharedState;

// Helpers

async fn user_from_request_parts(
    parts: &mut axum::http::request::Parts,
    state: &SharedState,
) -> Result<UserRead, ApiError> {
    let token = parts
        .headers
        .get("Authorization")
        .ok_or(ApiError::bad_auth_header("header missing"))?
        .to_str()
        .map_err(|_| ApiError::bad_auth_header("bad value"))?
        .strip_prefix("Bearer ")
        .ok_or(ApiError::bad_auth_header("not a Bearer token"))?;

    let payload = TokenPayload::decode(token).map_err(|e| ApiError::unauthorized(e.to_string()))?;
    let cruds = CrudsUser::new(state.clone());
    cruds.get_cache(payload.user_id).await
}

// User extractor

pub struct Auth(pub UserRead);

impl FromRequestParts<SharedState> for Auth {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &SharedState,
    ) -> Result<Self, Self::Rejection> {
        let user = user_from_request_parts(parts, state).await?;
        Ok(Self(user))
    }
}

// Admin extractor

pub struct Admin(pub UserRead);

impl FromRequestParts<SharedState> for Admin {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &SharedState,
    ) -> Result<Self, Self::Rejection> {
        let user = user_from_request_parts(parts, state).await?;
        if !user.is_admin {
            return Err(ApiError::unauthorized("Not and admin".to_string()));
        }
        Ok(Self(user))
    }
}

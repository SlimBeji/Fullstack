use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

// --- Signin Schemas ----
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct SigninSchema {
    pub username: String,
    pub password: String,
}

// Response Schemas
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EncodedTokenSchema {
    pub access_token: String,
    pub token_type: String,
    pub user_id: String,
    pub email: String,
    pub expires_in: u16,
}

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

impl EncodedTokenSchema {
    pub fn example() -> Self {
        Self {
            access_token: "a_very_secret_token".to_string(),
            token_type: "bearer".to_string(),
            user_id: "1234".to_string(),
            email: "mslimbeji@gmail.com".to_string(),
            expires_in: 3600,
        }
    }
}

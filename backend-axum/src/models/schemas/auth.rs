use axum::Json;
use axum::extract::{FromRequest, Request};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;

use crate::lib_::types_::upload::FileToUpload;
use crate::lib_::utils::axum::MultipartForm;

// --- Signup Schemas ----
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct SignupSchemaSwagger {
    pub name: String,
    pub email: String,
    pub password: String,
    #[schema(format = "binary", required = false)]
    pub image: String,
}

#[derive(Debug)]
pub struct SignupSchema {
    pub name: String,
    pub email: String,
    pub password: String,
    pub image: Option<FileToUpload>,
}

impl<S> FromRequest<S> for SignupSchema
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<Value>);

    async fn from_request(
        req: Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let multipart_form =
            MultipartForm::parse_multipart_request(req, state).await?;

        let name = multipart_form.get_text("name")?;
        let email = multipart_form.get_text("email")?;
        let password = multipart_form.get_text("password")?;
        let image = multipart_form.get_file_optional("image")?;

        Ok(Self {
            name,
            email,
            password,
            image,
        })
    }
}

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

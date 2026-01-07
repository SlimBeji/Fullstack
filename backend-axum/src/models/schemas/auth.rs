use axum::extract::{FromRequest, Request};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

use crate::lib_::{
    axum_::{ApiError, MultipartForm},
    types_::FileToUpload,
    validator_::{email_strict, object_id, token_type},
};

// --- Signup Schemas ----
#[allow(dead_code)]
#[derive(ToSchema)]
pub struct SignupSchemaSwagger {
    /// The user name, two characters at least
    #[schema(example = "Slim Beji")]
    pub name: String,

    /// The user email
    #[schema(example = "mslimbeji@gmail.com")]
    pub email: String,

    /// The user password, 10 characters at least
    #[schema(example = "very_secret")]
    pub password: String,

    /// User's profile image (JPEG)
    #[schema(format = "binary", required = false)]
    pub image: String,
}

#[derive(Debug, Validate)]
pub struct SignupSchema {
    #[validate(length(min = 2))]
    pub name: String,

    #[validate(custom(function = "email_strict"))]
    pub email: String,

    #[validate(length(min = 10))]
    pub password: String,

    pub image: Option<FileToUpload>,
}

impl<S> FromRequest<S> for SignupSchema
where
    S: Send + Sync,
{
    type Rejection = ApiError;

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
#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
pub struct SigninSchema {
    /// The user email (We use username here because of OAuth spec)
    #[schema(example = "mslimbeji@gmail.com")]
    #[validate(custom(function = "email_strict"))]
    pub username: String,

    /// The user password, 10 characters at least
    #[schema(example = "very_secret")]
    #[validate(length(min = 10))]
    pub password: String,
}

// Response Schemas
#[derive(Serialize, Deserialize, ToSchema, Validate)]
pub struct EncodedTokenSchema {
    /// A generated web token. The 'Bearer ' prefix needs to be added for authentication
    #[schema(
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"
    )]
    pub access_token: String,

    /// The type of token. Only 'bearer' is supported.
    #[schema(example = "bearer")]
    #[validate(custom(function = "token_type"))]
    pub token_type: String,

    /// The user ID, 24 characters
    #[schema(example = "683b21134e2e5d46978daf1f")]
    #[validate(custom(function = "object_id"))]
    pub user_id: String,

    /// The user email
    #[schema(example = "mslimbeji@gmail.com")]
    #[validate(custom(function = "email_strict"))]
    pub email: String,

    /// The UNIX timestamp the token expires at
    #[schema(example = "1751879562")]
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

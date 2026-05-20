use std::collections::HashMap;

use axum::extract::{FromRequest, Request};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use time::Duration;
use utoipa::ToSchema;
use validator::{Validate, ValidationError};

use crate::{
    config,
    lib_::{
        axum_::MultipartForm,
        types_::{ApiError, FileToUpload, SimpleError},
        utils::{decode_payload, encode_payload},
        validator_::{email_strict, string_length},
    },
};

// --- Custom Validators ----

pub fn validate_token(t: &str) -> Result<(), ValidationError> {
    if t != "bearer" {
        let mut err = ValidationError::new("invalid_token_type");
        err.message = Some("Token type must be 'bearer'".into());
        return Err(err);
    }
    Ok(())
}

// --- Token Payload ----

pub struct TokenPayload {
    pub user_id: u32,
    pub email: String,
}

impl TokenPayload {
    pub fn decode(encoded: &str) -> Result<Self, SimpleError> {
        let decoded = decode_payload(encoded, &config::ENV.secret_key)?;
        let user_id = decoded
            .get("user_id")
            .and_then(|v| v.as_u64())
            .ok_or(SimpleError::from("Token Not Valid"))? as u32;
        // .as_u64()
        // .ok_or(SimpleError::from("Token Not Valid"))? as u32;
        let email = decoded
            .get("email")
            .and_then(|v| v.as_str())
            .ok_or(SimpleError::from("Token Not Valid"))?
            .to_string();
        Ok(Self { user_id, email })
    }
}

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

    /// The user password, 8 characters at least
    #[schema(example = "very_secret")]
    pub password: String,

    /// User's profile image (JPEG)
    #[schema(format = "binary", required = false)]
    pub image: String,
}

#[derive(Debug, Validate)]
pub struct SignupSchema {
    #[validate(custom(function = "string_length::<2, 0>"))]
    pub name: String,

    #[validate(custom(function = "email_strict"))]
    pub email: String,

    #[validate(custom(function = "string_length::<8, 0>"))]
    pub password: String,

    pub image: Option<FileToUpload>,
}

impl<S: Send + Sync> FromRequest<S> for SignupSchema {
    type Rejection = ApiError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let multipart_form = MultipartForm::parse_multipart_request(req, state).await?;

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

    /// The user password, 8 characters at least
    #[schema(example = "very_secret")]
    #[validate(custom(function = "string_length::<8, 0>"))]
    pub password: String,
}

// Response Schemas

#[derive(Serialize, Deserialize, ToSchema, Validate)]
pub struct EncodedToken {
    /// A generated web token. The 'Bearer ' prefix needs to be added for authentication
    #[schema(
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"
    )]
    pub access_token: String,

    /// The type of token. Only 'bearer' is supported.
    #[schema(example = "bearer")]
    #[validate(custom(function = "validate_token"))]
    pub token_type: String,

    /// The user ID
    #[schema(example = "123456789")]
    pub user_id: u32,

    /// The user email
    #[schema(example = "mslimbeji@gmail.com")]
    #[validate(custom(function = "email_strict"))]
    pub email: String,

    /// The UNIX timestamp the token expires at
    #[schema(example = "1751879562")]
    pub expires_in: u16,
}

impl EncodedToken {
    pub fn example() -> Self {
        Self {
            access_token: "a_very_secret_token".to_string(),
            token_type: "bearer".to_string(),
            user_id: 123456789,
            email: "mslimbeji@gmail.com".to_string(),
            expires_in: 3600,
        }
    }

    pub fn create(id: u32, email: &str) -> Result<Self, jsonwebtoken::errors::Error> {
        let mut payload = HashMap::new();
        payload.insert("user_id".to_string(), Value::Number(id.into()));
        payload.insert("email".to_string(), Value::String(email.into()));
        let access_token = encode_payload(
            payload,
            &config::ENV.secret_key,
            Duration::seconds(config::ENV.jwt_expiration as i64),
        )?;
        Ok(Self {
            access_token,
            token_type: "bearer".to_string(),
            user_id: id,
            email: email.to_string(),
            expires_in: 3600,
        })
    }
}

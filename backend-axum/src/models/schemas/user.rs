use axum::extract::FromRequest;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use utoipa::ToSchema;
use validator::Validate;

use crate::lib_::{
    axum_::{ApiError, MultipartForm},
    types_::FileToUpload,
    validator_::{email_strict, object_id},
};

// --- Database Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserDB {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub name: String,
    pub email: String,
    pub is_admin: bool,
    pub password: String,
    pub image_url: Option<String>,
    pub places: Vec<String>,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

// --- Seed Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug)]
pub struct UserSeed {
    pub ref_: i32,
    pub name: String,
    pub email: String,
    pub is_admin: bool,
    pub password: String,
    pub image_url: Option<String>,
}

// --- Create Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug, Deserialize, Validate)]
pub struct UserCreate {
    #[validate(length(min = 2))]
    pub name: String,
    #[validate(custom(function = "email_strict"))]
    pub email: String,
    pub is_admin: bool,
    #[validate(length(min = 10))]
    pub password: String,
    pub image_url: Option<String>,
}

// --- Post Schema ---
#[allow(dead_code)] // to be removed
#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserPostSwagger {
    /// The user name, two characters at least
    #[schema(example = "Slim Beji")]
    pub name: String,

    /// The user email
    #[schema(example = "mslimbeji@gmail.com")]
    pub email: String,

    /// Whether the user is an admin or not
    #[schema(example = false)]
    pub is_admin: bool,

    /// The user password, 10 characters at least
    #[schema(example = "very_secret")]
    pub password: String,

    /// User's profile image (JPEG)
    #[schema(format = "binary", required = false)]
    pub image: String,
}

#[allow(dead_code)] // to be removed
#[derive(Debug, Validate)]
pub struct UserPost {
    /// The user name, two characters at least
    #[validate(length(min = 2))]
    pub name: String,

    /// The user email
    #[validate(custom(function = "email_strict"))]
    pub email: String,

    /// Whether the user is an admin or not
    pub is_admin: bool,

    /// The user password, 10 characters at least
    #[validate(length(min = 10))]
    pub password: String,

    /// User's profile image (JPEG)
    pub image: Option<FileToUpload>,
}

impl<S: Send + Sync> FromRequest<S> for UserPost {
    type Rejection = ApiError;

    async fn from_request(
        req: axum::extract::Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let multipart_form =
            MultipartForm::parse_multipart_request(req, state).await?;

        let name = multipart_form.get_text("name")?;
        let email = multipart_form.get_text("email")?;
        let is_admin = multipart_form.get_boolean("isAdmin")?;
        let password = multipart_form.get_text("password")?;
        let image = multipart_form.get_file_optional("image")?;

        Ok(Self {
            name,
            email,
            is_admin,
            password,
            image,
        })
    }
}

// --- Read Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UserRead {
    /// The user ID, 24 characters
    #[schema(example = "683b21134e2e5d46978daf1f")]
    #[validate(custom(function = "object_id"))]
    pub id: String,

    /// The user name, two characters at least
    #[schema(example = "Slim Beji")]
    #[validate(length(min = 2))]
    pub name: String,

    /// The user email
    #[schema(example = "mslimbeji@gmail.com")]
    #[validate(custom(function = "email_strict"))]
    pub email: String,

    /// Whether the user is an admin or not
    #[schema(example = false)]
    pub is_admin: bool,

    /// Local url on the storage
    #[schema(example = "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg")]
    pub image_url: Option<String>,

    /// The id of places belonging to the user, 24 characters
    #[schema(example = json!(["683b21134e2e5d46978daf1f"]))]
    pub places: Vec<String>,
}

impl UserRead {
    pub fn example() -> Self {
        Self {
            id: "683b21134e2e5d46978daf1f".to_string(),
            name: "Slim Beji".to_string(),
            email: "mslimbeji@gmail.com".to_string(),
            is_admin: false,
            image_url: Some(
                "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg".to_string(),
            ),
            places: vec!["683b21134e2e5d46978daf1f".to_string()],
        }
    }
}

// --- Update Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
pub struct UserUpdate {
    /// The user name, two characters at least
    #[schema(example = "Slim Beji")]
    #[validate(length(min = 2))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    /// The user email
    #[schema(example = "mslimbeji@gmail.com")]
    #[validate(custom(function = "email_strict"))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,

    /// The user password, 10 characters at least
    #[schema(example = "very_secret")]
    #[validate(length(min = 10))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
}

// --- Put Schema ---
#[allow(dead_code)] // to be removed
pub type UserPut = UserUpdate;

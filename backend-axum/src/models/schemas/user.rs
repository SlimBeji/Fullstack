use axum::extract::FromRequest;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use utoipa::{IntoParams, ToSchema};
use validator::Validate;

use crate::config::ENV;
use crate::lib_::{
    axum_::{ApiError, MultipartForm},
    types_::{FileToUpload, FindQuery, PaginatedData, ToFindQuery},
    utils::parse_enum_array,
    validator_::{FiltersReader, email_strict, object_id, string_length},
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
    #[validate(custom(function = "string_length::<2, 0>"))]
    pub name: String,
    #[validate(custom(function = "email_strict"))]
    pub email: String,
    pub is_admin: bool,
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub password: String,
    pub image_url: Option<String>,
}

// --- Post Schema ---
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

#[derive(Debug, Validate)]
pub struct UserPost {
    #[validate(custom(function = "string_length::<2, 2>"))]
    pub name: String,
    #[validate(custom(function = "email_strict"))]
    pub email: String,
    pub is_admin: bool,
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub password: String,
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
#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
#[schema(example = json!({
    "id": "683b21134e2e5d46978daf1f",
    "name": "Slim Beji",
    "email": "mslimbeji@gmail.com",
    "isAdmin": false,
    "imageUrl": "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
    "places": ["683b21134e2e5d46978daf1f"],
    "createdAt": "2024-01-12T10:15:30.000Z",
    "updatedAt": "2024-01-12T10:15:30.000Z"
}))]
#[serde(rename_all = "camelCase")]
pub struct UserRead {
    /// The user ID, 24 characters
    #[validate(custom(function = "object_id"))]
    pub id: String,

    /// The user name, two characters at least
    #[validate(custom(function = "string_length::<2, 0>"))]
    pub name: String,

    /// The user email
    #[validate(custom(function = "email_strict"))]
    pub email: String,

    /// Whether the user is an admin or not
    pub is_admin: bool,

    /// Local url on the storage
    pub image_url: Option<String>,

    /// The id of places belonging to the user, 24 characters
    pub places: Vec<String>,

    // creation datetime
    #[schema(value_type = String, format = DateTime)]
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,

    // last update datetime
    #[schema(value_type = String, format = DateTime)]
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
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
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }
}

pub type UsersPaginated = PaginatedData<UserRead>;

// --- Filters Schema ---
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum UserSelectableFields {
    Id,
    Name,
    Email,
    IsAdmin,
    ImageUrl,
    Places,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum UserSortableFields {
    #[serde(rename = "createdAt")]
    CreatedAtAsc,
    #[serde(rename = "-createdAt")]
    CreatedAtDesc,
    #[serde(rename = "name")]
    NameAsc,
    #[serde(rename = "-name")]
    NameDesc,
    #[serde(rename = "email")]
    EmailAsc,
    #[serde(rename = "-email")]
    EmailDesc,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, IntoParams)]
#[into_params(parameter_in = Query)]
#[serde(rename_all = "snake_case")]
pub struct UserFilters {
    #[param(example = 1)]
    #[schema(example = 1)]
    pub page: Option<usize>,
    #[param(example = 100)]
    #[schema(example = 100)]
    pub size: Option<usize>,
    pub sort: Option<Vec<UserSortableFields>>,
    pub fields: Option<Vec<UserSelectableFields>>,
    #[param(example = json!(["683b21134e2e5d46978daf1f"]))]
    #[schema(example = json!(["683b21134e2e5d46978daf1f"]))]
    pub id: Option<Vec<String>>,
    #[param(example = json!(["eq:Slim Beji"]))]
    #[schema(example = json!(["eq:Slim Beji"]))]
    pub name: Option<Vec<String>>,
    #[param(example = json!(["eq:mslimbeji@gmail.com"]))]
    #[schema(example = json!(["eq:mslimbeji@gmail.com"]))]
    pub email: Option<Vec<String>>,
}

impl ToFindQuery for UserFilters {
    fn to_find_query(self) -> Result<FindQuery, validator::ValidationErrors> {
        let page = self.page.unwrap_or(1);
        let size = self.size.unwrap_or(ENV.max_items_per_page);
        let fields = parse_enum_array(self.fields);
        let sort = parse_enum_array(self.sort);

        let mut filter_reader = FiltersReader::new();
        filter_reader.read_object_id_filters("id", &self.id);
        filter_reader.read_string_filters("name", &self.name, &vec![], false);
        filter_reader.read_string_filters("email", &self.email, &vec![], false);
        match filter_reader.eval() {
            Ok(filters) => Ok(FindQuery {
                page,
                size,
                sort,
                fields,
                filters,
            }),
            Err(errors) => Err(errors),
        }
    }
}

// --- Update Schema ---
#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
#[schema(example = json!({
    "name": "Slim Beji",
    "email": "mslimbeji@gmail.com",
    "password": "very_secret"
}))]
pub struct UserUpdate {
    /// The user name, two characters at least
    #[validate(custom(function = "string_length::<2, 0>"))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    /// The user email
    #[validate(custom(function = "email_strict"))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,

    /// The user password, 10 characters at least
    #[validate(custom(function = "string_length::<10, 0>"))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
}

// --- Put Schema ---
pub type UserPut = UserUpdate;

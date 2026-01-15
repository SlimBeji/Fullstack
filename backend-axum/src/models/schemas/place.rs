use axum::extract::FromRequest;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use utoipa::ToSchema;
use validator::Validate;

use crate::lib_::{
    axum_::{ApiError, MultipartForm},
    types_::{FileToUpload, PaginatedData},
    validator_::object_id,
};

// --- Fields ---
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct Location {
    /// The latitude of the place
    #[schema(example = 51.48180425016331)]
    pub lat: f64,

    /// The longitude of the place
    #[schema(example = -0.19090418688755467)]
    pub lng: f64,
}

// --- Database Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceDB {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub title: String,
    pub description: String,
    pub address: String,
    pub location: Location,
    pub image_url: Option<String>,
    pub embedding: Option<Vec<f64>>,
    pub creator_id: ObjectId,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

// --- Seed Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug)]
pub struct PlaceSeed {
    pub ref_: i32,
    pub creator_ref: i32,
    pub title: String,
    pub description: String,
    pub address: String,
    pub location: Location,
    pub embedding: Option<Vec<f64>>,
    pub image_url: Option<String>,
}

// --- Create Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug, Deserialize, Validate)]
pub struct PlaceCreate {
    #[validate(length(min = 10))]
    pub title: String,
    #[validate(length(min = 10))]
    pub description: String,
    #[validate(length(min = 10))]
    pub address: String,
    pub location: Location,
    #[validate(length(equal = 384))]
    pub embedding: Option<Vec<f64>>,
    pub image_url: String,
    #[validate(custom(function = "object_id"))]
    pub creator_id: String,
}

// --- Post Schema ---
#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PlacePostSwagger {
    /// The place title/name, 10 characters minimum
    #[schema(example = "Stamford Bridge")]
    pub title: String,

    /// The place description, 10 characters minimum
    #[schema(example = "Stadium of Chelsea football club")]
    pub description: String,

    /// The place address
    #[schema(example = "Fulham road")]
    pub address: String,

    /// The latitude of the place
    #[schema(example = 51.48180425016331)]
    pub lat: f64,

    /// The longitude of the place
    #[schema(example = -0.19090418688755467)]
    pub lng: f64,

    /// Place Image (JPEG)
    #[schema(format = "binary", required = false)]
    pub image: String,

    /// The ID of the place creator, 24 characters
    #[schema(example = "683b21134e2e5d46978daf1f")]
    pub creator_id: String,
}

#[derive(Debug, Validate)]
pub struct PlacePost {
    #[validate(length(min = 10))]
    pub title: String,
    #[validate(length(min = 10))]
    pub description: String,
    #[validate(length(min = 10))]
    pub address: String,
    pub lat: f64,
    pub lng: f64,
    pub image: Option<FileToUpload>,
    #[validate(custom(function = "object_id"))]
    pub creator_id: String,
}

impl<S: Send + Sync> FromRequest<S> for PlacePost {
    type Rejection = ApiError;

    async fn from_request(
        req: axum::extract::Request,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let multipart_form =
            MultipartForm::parse_multipart_request(req, state).await?;

        let title = multipart_form.get_text("title")?;
        let description = multipart_form.get_text("description")?;
        let address = multipart_form.get_text("address")?;
        let lat = multipart_form.get_number("lat")?;
        let lng = multipart_form.get_number("lng")?;
        let image = multipart_form.get_file_optional("image")?;
        let creator_id = multipart_form.get_text("creatorId")?;

        Ok(Self {
            title,
            description,
            address,
            lat,
            lng,
            image,
            creator_id,
        })
    }
}

// --- Read Schema ---
#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
#[schema(example = json!({
    "id": "683b21134e2e5d46978daf1f",
    "title": "Stamford Bridge",
    "description": "Stadium of Chelsea football club",
    "address": "Fulham road",
    "location": {
        "lat": 51.48180425016331,
        "lng": -0.19090418688755467
    },
    "image_url": "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
    "creatorId": "683b21134e2e5d46978daf1f",
    "createdAt": "2024-01-12T10:15:30.000Z",
    "updatedAt": "2024-01-12T10:15:30.000Z"
}))]
#[serde(rename_all = "camelCase")]
pub struct PlaceRead {
    /// The ID of the place 24 characters
    #[validate(custom(function = "object_id"))]
    pub id: String,

    /// The place title/name, 10 characters minimum
    #[validate(length(min = 10))]
    pub title: String,

    /// The place description, 10 characters minimum
    #[validate(length(min = 10))]
    pub description: String,

    /// The place address
    #[validate(length(min = 10))]
    pub address: String,

    /// Location object (can be sent as JSON string)
    pub location: Location,

    /// local url on the storage
    pub image_url: Option<String>,

    /// The ID of the place creator, 24 characters
    #[validate(custom(function = "object_id"))]
    pub creator_id: String,

    // creation datetime
    #[schema(value_type = String, format = DateTime)]
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,

    // last update datetime
    #[schema(value_type = String, format = DateTime)]
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

impl PlaceRead {
    pub fn example() -> Self {
        Self {
            id: "683b21134e2e5d46978daf1f".to_string(),
            title: "Stamford Bridge".to_string(),
            description: "Stadium of Chelsea football club".to_string(),
            address: "Fulham road".to_string(),
            location: Location {
                lat: 51.48180425016331,
                lng: -0.19090418688755467,
            },
            image_url: Some(
                "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg".to_string(),
            ),
            creator_id: "683b21134e2e5d46978daf1f".to_string(),
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }
}

pub type PlacesPaginated = PaginatedData<PlaceRead>;

// --- Update Schema ---
#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct PlaceUpdate {
    #[validate(length(min = 10))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    #[validate(length(min = 10))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    #[validate(length(min = 10))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub creator_id: Option<ObjectId>,
}

// --- Put Schema ---
#[derive(Debug, Serialize, Deserialize, Validate, ToSchema)]
#[schema(example = json!({
    "title": "Stamford Bridge",
    "description": "Stadium of Chelsea football club",
    "address": "Fulham road",
    "location": {
        "lat": 51.48180425016331,
        "lng": -0.19090418688755467
    },
    "creatorId": "683b21134e2e5d46978daf1f"
}))]
// using full example because location example does not render well when set separately
#[serde(rename_all = "camelCase")]
pub struct PlacePut {
    /// The place title/name, 10 characters minimum
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(min = 10))]
    pub title: Option<String>,

    /// The place description, 10 characters minimum
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(min = 10))]
    pub description: Option<String>,

    /// The place address
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(min = 10))]
    pub address: Option<String>,

    /// Location object (can be sent as JSON string)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,

    /// The ID of the place creator, 24 characters
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(custom(function = "object_id"))]
    pub creator_id: Option<String>,
}

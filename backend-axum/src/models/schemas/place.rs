use axum::extract::FromRequest;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use utoipa::{IntoParams, ToSchema};
use validator::Validate;

use crate::config::ENV;
use backend::{
    axum_::{ApiError, MultipartForm},
    types_::{FileToUpload, FindQuery, PaginatedData, ToFindQuery},
    utils::parse_enum_array,
    validator_::{FiltersReader, array_length, object_id, string_length},
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
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub title: String,
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub description: String,
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub address: String,
    pub location: Location,
    #[validate(custom(function = "array_length::<f64, 384, 384>"))]
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
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub title: String,
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub description: String,
    #[validate(custom(function = "string_length::<10, 0>"))]
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
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub title: String,

    /// The place description, 10 characters minimum
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub description: String,

    /// The place address
    #[validate(custom(function = "string_length::<10, 0>"))]
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

// --- Filters Schema ---
// --- Filters Schema ---
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PlaceSelectableFields {
    Id,
    Title,
    Description,
    Address,
    #[serde(rename = "location.lat")]
    LocationLat,
    #[serde(rename = "location.lng")]
    LocationLng,
    ImageUrl,
    CreatorId,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PlaceSortableFields {
    #[serde(rename = "createdAt")]
    CreatedAtAsc,
    #[serde(rename = "-createdAt")]
    CreatedAtDesc,
    #[serde(rename = "title")]
    TitleAsc,
    #[serde(rename = "-title")]
    TitleDesc,
    #[serde(rename = "description")]
    DescriptionAsc,
    #[serde(rename = "-description")]
    DescriptionDesc,
    #[serde(rename = "address")]
    AddressAsc,
    #[serde(rename = "-address")]
    AddressDesc,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, IntoParams)]
#[into_params(parameter_in = Query)]
#[serde(rename_all = "snake_case")]
pub struct PlaceFilters {
    #[param(example = 1)]
    #[schema(example = 1)]
    pub page: Option<usize>,
    #[param(example = 100)]
    #[schema(example = 100)]
    pub size: Option<usize>,
    pub sort: Option<Vec<PlaceSortableFields>>,
    pub fields: Option<Vec<PlaceSelectableFields>>,
    #[param(example = json!(["683b21134e2e5d46978daf1f"]))]
    #[schema(example = json!(["683b21134e2e5d46978daf1f"]))]
    pub id: Option<Vec<String>>,
    #[param(example = json!(["eq:Some Place"]))]
    #[schema(example = json!(["eq:Some Place"]))]
    pub title: Option<Vec<String>>,
    #[param(example = json!(["regex:football"]))]
    #[schema(example = json!(["regex:football"]))]
    pub description: Option<Vec<String>>,
    #[param(example = json!(["regex:d{1,2} Boulevard"]))]
    #[schema(example = json!(["regex:d{1,2} Boulevard"]))]
    pub address: Option<Vec<String>>,
    #[param(example = json!(["eq:683b21134e2e5d46978daf1f"]))]
    #[schema(example = json!(["eq:683b21134e2e5d46978daf1f"]))]
    pub creator_id: Option<Vec<String>>,
    #[param(example = json!(["gt:3.5"]))]
    #[schema(example = json!(["gt:3.5"]))]
    pub location_lat: Option<Vec<String>>,
    #[param(example = json!(["lt:4.5"]))]
    #[schema(example = json!(["lt:4.5"]))]
    pub location_lng: Option<Vec<String>>,
}

impl ToFindQuery for PlaceFilters {
    fn to_find_query(self) -> Result<FindQuery, validator::ValidationErrors> {
        let page = self.page.unwrap_or(1);
        let size = self.size.unwrap_or(ENV.max_items_per_page);
        let fields = parse_enum_array(self.fields);
        let sort = parse_enum_array(self.sort);

        let mut filter_reader = FiltersReader::new();
        filter_reader.read_object_id_filters("id", &self.id);
        filter_reader.read_string_filters(
            "title",
            &self.title,
            &vec![string_length::<10, 0>],
            false,
        );
        filter_reader.read_string_filters(
            "description",
            &self.description,
            &vec![string_length::<10, 0>],
            false,
        );
        filter_reader.read_string_filters(
            "address",
            &self.address,
            &vec![string_length::<10, 0>],
            false,
        );
        filter_reader.read_object_id_filters("creatorId", &self.creator_id);
        filter_reader.read_numeric_filters(
            "locationLat",
            &self.location_lat,
            &vec![],
        );
        filter_reader.read_numeric_filters(
            "locationLng",
            &self.location_lng,
            &vec![],
        );
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
#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct PlaceUpdate {
    #[validate(custom(function = "string_length::<10, 0>"))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,

    #[validate(custom(function = "string_length::<10, 0>"))]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    #[validate(custom(function = "string_length::<10, 0>"))]
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
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub title: Option<String>,

    /// The place description, 10 characters minimum
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub description: Option<String>,

    /// The place address
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub address: Option<String>,

    /// Location object (can be sent as JSON string)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,

    /// The ID of the place creator, 24 characters
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(custom(function = "object_id"))]
    pub creator_id: Option<String>,
}

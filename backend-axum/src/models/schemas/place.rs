use axum::extract::FromRequest;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use utoipa::{IntoParams, ToSchema};
use validator::Validate;

use crate::config::ENV;
use backend::{
    axum_::{ApiError, MultipartForm},
    types_::{
        FileToUpload, FiltersReader, PaginatedData, SearchQuery, ToSearchQuery,
    },
    utils::parse_enum_array,
    validator_::{array_length, string_length},
};

// --- Selectables, Serchables, Sortables ----

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PlaceSelectableFields {
    Id,
    Title,
    Description,
    Address,
    Location,
    ImageUrl,
    CreatorId,
    CreatedAt,
}

#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PlaceSearchableFields {
    Id,
    Title,
    Description,
    Address,
    CreatorId,
    LocationLat,
    LocationLng,
    CreatedAt,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub enum PlaceSortableFields {
    #[serde(rename = "created_at")]
    CreatedAtAsc,
    #[serde(rename = "-created_at")]
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

// --- Fields ----

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct Location {
    /// The latitude of the place
    #[schema(example = 51.48180425016331)]
    pub lat: f64,

    /// The longitude of the place
    #[schema(example = -0.19090418688755467)]
    pub lng: f64,
}

// --- Base Schemas ----

#[allow(dead_code)] // to be removed
#[derive(Debug)]
pub struct PlaceSeed {
    pub ref_: u32,
    pub creator_ref: u32,
    pub title: String,
    pub description: String,
    pub address: String,
    pub location: Location,
    pub embedding: Option<Vec<f32>>,
    pub image_url: String,
}

// --- Create Schema ---

#[allow(dead_code)] // to be removed
#[derive(Debug, Deserialize, Validate)]
pub struct PlaceCreate {
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub title: String,
    #[validate(custom(function = "string_length::<10, 0>"))]
    pub description: String,
    #[validate(custom(function = "string_length::<1, 0>"))]
    pub address: String,
    pub location: Location,
    #[validate(custom(function = "array_length::<f64, 384, 384>"))]
    pub embedding: Option<Vec<f64>>,
    pub image_url: String,
    pub creator_id: u32,
}

#[derive(Serialize, ToSchema)]
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

    /// The ID of the place creator
    #[schema(example = 123456789)]
    pub creator_id: u32,
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
    pub creator_id: u32,
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
        let creator_id = multipart_form.get_number("creator_id")?;

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

// --- Read Schemas ---

#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
#[schema(example = json!({
    "id": 123456789,
    "title": "Stamford Bridge",
    "description": "Stadium of Chelsea football club",
    "address": "Fulham road",
    "location": {
        "lat": 51.48180425016331,
        "lng": -0.19090418688755467
    },
    "image_url": "avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
    "creator_id": 123456789,
    "created_at": "2024-01-12T10:15:30.000Z",
}))]
pub struct PlaceRead {
    /// The ID of the place
    pub id: u32,

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

    /// image url
    pub image_url: Option<String>,

    /// The ID of the place creator
    pub creator_id: u32,

    // creation datetime
    #[schema(value_type = String, format = DateTime)]
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
}

impl PlaceRead {
    pub fn example() -> Self {
        Self {
            id: 123456789,
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
            creator_id: 123456789,
            created_at: OffsetDateTime::now_utc(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Validate, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct PlaceGet {
    /// Fields to include in the response; omit for complete data
    #[param(value_type = Option<Vec<PlaceSelectableFields>>)]
    pub fields: Option<Vec<PlaceSelectableFields>>,
}

// --- Update Schema ---

#[derive(Debug, Serialize, Deserialize, ToSchema, Validate)]
#[schema(example = json!({
    "title": "Stamford Bridge",
    "description": "Stadium of Chelsea football club",
    "address": "Fulham road",
    "location": {
        "lat": 51.48180425016331,
        "lng": -0.19090418688755467
    }
}))]
// using full example because location example does not render well when set separately
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
}

pub type PlacePut = PlaceUpdate;

// --- Search Schemas ---

pub type PlacesPaginated = PaginatedData<PlaceRead>;

#[derive(Debug, Serialize, Deserialize, ToSchema, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct PlaceSearch {
    /// The page number
    #[param(example = 1)]
    #[schema(example = 1)]
    pub page: Option<usize>,

    /// Items per page
    #[param(example = 100)]
    #[schema(example = 100)]
    pub size: Option<usize>,

    /// Fields to use for sorting. Use the '-' for descending sorting
    pub sort: Option<Vec<PlaceSortableFields>>,

    /// Fields to include in the response; omit for complete data
    pub fields: Option<Vec<PlaceSelectableFields>>,

    /// The ID of the place
    #[param(example = json!(["123456789"]))]
    #[schema(example = json!(["123456789"]))]
    pub id: Option<Vec<String>>,

    /// The place title/name, 10 characters minimum
    #[param(example = json!(["eq:Some Place"]))]
    #[schema(example = json!(["eq:Some Place"]))]
    pub title: Option<Vec<String>>,

    /// The place description, 10 characters minimum
    #[param(example = json!(["like:football"]))]
    #[schema(example = json!(["like:football"]))]
    pub description: Option<Vec<String>>,

    /// The place address
    #[param(example = json!(["ilike:boulevard"]))]
    #[schema(example = json!(["ilike:boulevard"]))]
    pub address: Option<Vec<String>>,

    /// The ID of the place creator
    #[param(example = json!(["in:123456789"]))]
    #[schema(example = json!(["in:123456789"]))]
    pub creator_id: Option<Vec<String>>,

    /// The latitude of the place
    #[param(example = json!(["gt:3.5"]))]
    #[schema(example = json!(["gt:3.5"]))]
    pub location_lat: Option<Vec<String>>,

    /// The longitude of the place
    #[param(example = json!(["lt:4.5"]))]
    #[schema(example = json!(["lt:4.5"]))]
    pub location_lng: Option<Vec<String>>,

    /// creation datetime
    #[param(example = json!(["gt:2025-09-28"]))]
    #[schema(example = json!(["gt:2025-09-28"]))]
    pub created_at: Option<Vec<String>>,
}

impl ToSearchQuery for PlaceSearch {
    fn to_search_query(
        self,
    ) -> Result<SearchQuery, validator::ValidationErrors> {
        let page = self.page.unwrap_or(1);
        let size = self.size.unwrap_or(ENV.max_items_per_page);
        let select = parse_enum_array(self.fields);
        let order_by = parse_enum_array(self.sort);

        let mut filter_reader = FiltersReader::new();
        filter_reader.read_index_filters("id", &self.id);
        filter_reader.read_string_filters(
            "title",
            &self.title,
            &vec![string_length::<10, 0>],
        );
        filter_reader.read_string_filters(
            "description",
            &self.description,
            &vec![string_length::<10, 0>],
        );
        filter_reader.read_string_filters(
            "address",
            &self.address,
            &vec![string_length::<10, 0>],
        );
        filter_reader.read_index_filters("creator_id", &self.creator_id);
        filter_reader.read_f64_filters(
            "location_lat",
            &self.location_lat,
            &vec![],
        );
        filter_reader.read_f64_filters(
            "location_lng",
            &self.location_lng,
            &vec![],
        );
        filter_reader.read_datetime_filters(
            "created_at",
            &self.created_at,
            &vec![],
        );
        match filter_reader.eval() {
            Ok(where_) => Ok(SearchQuery {
                page,
                size,
                order_by,
                select,
                where_,
            }),
            Err(errors) => Err(errors),
        }
    }
}

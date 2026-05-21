use axum::extract::FromRequest;
use sea_orm::Order;
use sea_orm::sea_query::Expr;
use sea_orm::sea_query::extension::postgres::PgExpr;
use serde::{Deserialize, Serialize};
use strum::IntoStaticStr;
use time::OffsetDateTime;
use utoipa::{IntoParams, ToSchema};
use validator::Validate;

use crate::config::ENV;
use crate::lib_::types_::{SearchableTrait, SortableTrait};
use crate::lib_::{
    axum_::MultipartForm,
    types_::{ApiError, FileToUpload, FiltersReader, PaginatedData, SearchQuery, ToSearchQuery},
    validator_::{array_length, deserialize_f64_or_string, string_length},
};
use crate::models::orm::place;

// --- Consts ---

pub const LOCATION_LAT: &str = "lat";
pub const LOCATION_LNG: &str = "lng";

// --- Selectables, Serchables, Sortables ----

#[derive(Debug, PartialEq, Eq, Copy, Clone, IntoStaticStr, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum PlaceSelectable {
    Id,
    Title,
    Description,
    Address,
    Location,
    ImageUrl,
    CreatorId,
    CreatedAt,
}

#[derive(
    Debug, Copy, Clone, PartialEq, Eq, Hash, IntoStaticStr, Serialize, Deserialize, ToSchema,
)]
#[serde(rename_all = "snake_case")]
pub enum PlaceSearchable {
    Id,
    Title,
    Description,
    Address,
    CreatorId,
    LocationLat,
    LocationLng,
    CreatedAt,
}

impl SearchableTrait for PlaceSearchable {
    fn id() -> Self {
        Self::Id
    }

    fn to_expr(&self) -> Expr {
        match self {
            Self::Id => Expr::col(place::Column::Id),
            Self::Title => Expr::col(place::Column::Title),
            Self::Description => Expr::col(place::Column::Description),
            Self::Address => Expr::col(place::Column::Address),
            Self::CreatorId => Expr::col(place::Column::CreatorId),
            Self::LocationLat => Expr::col(place::Column::Location).cast_json_field(LOCATION_LAT),
            Self::LocationLng => Expr::col(place::Column::Location).cast_json_field(LOCATION_LNG),
            Self::CreatedAt => Expr::col(place::Column::CreatedAt),
        }
    }
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, ToSchema)]
pub enum PlaceSortable {
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

impl SortableTrait for PlaceSortable {
    fn to_sort(&self) -> (Expr, Order) {
        match self {
            Self::CreatedAtAsc => (Expr::col(place::Column::CreatedAt), Order::Asc),
            Self::CreatedAtDesc => (Expr::col(place::Column::CreatedAt), Order::Desc),
            Self::TitleAsc => (Expr::col(place::Column::Title), Order::Asc),
            Self::TitleDesc => (Expr::col(place::Column::Title), Order::Desc),
            Self::DescriptionAsc => (Expr::col(place::Column::Description), Order::Asc),
            Self::DescriptionDesc => (Expr::col(place::Column::Description), Order::Desc),
            Self::AddressAsc => (Expr::col(place::Column::Address), Order::Asc),
            Self::AddressDesc => (Expr::col(place::Column::Address), Order::Desc),
        }
    }
}

// --- Fields ----

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Validate)]
pub struct Location {
    /// The latitude of the place
    #[schema(example = 51.48180425016331)]
    #[serde(deserialize_with = "deserialize_f64_or_string")]
    pub lat: f64,

    /// The longitude of the place
    #[schema(example = -0.19090418688755467)]
    #[serde(deserialize_with = "deserialize_f64_or_string")]
    pub lng: f64,
}

// --- Base Schemas ----

#[derive(Debug)]
pub struct PlaceSeed {
    pub ref_: u32,
    pub creator_ref: u32,
    pub title: String,
    pub description: String,
    pub address: String,
    pub location: Location,
    pub embedding: Vec<f32>,
    pub image_url: String,
}

// --- Create Schema ---

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
    pub image_url: Option<String>,
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

    async fn from_request(req: axum::extract::Request, state: &S) -> Result<Self, Self::Rejection> {
        let multipart_form = MultipartForm::parse_multipart_request(req, state).await?;

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
    pub image_url: String,

    /// The ID of the place creator
    pub creator_id: u32,

    // creation datetime
    #[schema(value_type = String, format = DateTime)]
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
}

#[derive(Debug, Default, Serialize, Deserialize, ToSchema, Validate, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct PlaceGet {
    /// Fields to include in the response; omit for complete data
    #[param(value_type = Option<Vec<PlaceSelectable>>)]
    pub fields: Option<Vec<PlaceSelectable>>,
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
    pub sort: Option<Vec<PlaceSortable>>,

    /// Fields to include in the response; omit for complete data
    pub fields: Option<Vec<PlaceSelectable>>,

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
    type Selectable = PlaceSelectable;
    type Searchable = PlaceSearchable;
    type Sortable = PlaceSortable;

    fn to_search_query(
        self,
    ) -> Result<
        SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        validator::ValidationErrors,
    > {
        let page = self.page.unwrap_or(1);
        let size = self.size.unwrap_or(ENV.max_items_per_page);

        let mut filter_reader = FiltersReader::new();
        filter_reader.read_index_filters(PlaceSearchable::Id, &self.id);
        filter_reader.read_string_filters(
            PlaceSearchable::Title,
            &self.title,
            &vec![string_length::<10, 0>],
        );
        filter_reader.read_string_filters(
            PlaceSearchable::Description,
            &self.description,
            &vec![string_length::<10, 0>],
        );
        filter_reader.read_string_filters(
            PlaceSearchable::Address,
            &self.address,
            &vec![string_length::<10, 0>],
        );
        filter_reader.read_index_filters(PlaceSearchable::CreatorId, &self.creator_id);
        filter_reader.read_f64_filters(PlaceSearchable::LocationLat, &self.location_lat, &vec![]);
        filter_reader.read_f64_filters(PlaceSearchable::LocationLng, &self.location_lng, &vec![]);
        filter_reader.read_datetime_filters(PlaceSearchable::CreatedAt, &self.created_at, &vec![]);
        match filter_reader.eval() {
            Ok(where_) => Ok(SearchQuery {
                page: Some(page),
                size: Some(size),
                select: self.fields,
                order_by: self.sort,
                where_: Some(where_),
            }),
            Err(errors) => Err(errors),
        }
    }
}

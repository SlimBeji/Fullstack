use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct Location {
    pub lat: f64,
    pub lng: f64,
}

#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize)]
pub struct PlaceDB {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub address: String,
    pub location: Location,
    pub image_url: Option<String>,
    pub embedding: Option<Vec<f64>>,
    pub creator_id: u32,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

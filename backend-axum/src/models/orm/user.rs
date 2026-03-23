use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

#[allow(dead_code)] // to be removed
#[derive(Debug, Serialize, Deserialize)]
pub struct UserDB {
    pub id: u32,
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

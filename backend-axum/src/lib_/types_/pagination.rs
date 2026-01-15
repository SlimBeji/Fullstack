use serde::Serialize;
use std::fmt::Debug;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedData<T: Debug + Serialize + ToSchema> {
    #[schema(example = "2")]
    pub page: u32,
    #[schema(example = "10")]
    pub total_pages: u32,
    #[schema(example = "197")]
    pub total_count: u32,
    pub data: Vec<T>,
}

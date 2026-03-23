use serde::Serialize;
use std::fmt::Debug;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedData<T: Debug + Serialize + ToSchema> {
    #[schema(example = "1")]
    pub page: usize,

    #[schema(example = "2")]
    pub total_pages: usize,

    #[schema(example = "40")]
    pub total_count: usize,

    pub data: Vec<T>,
}

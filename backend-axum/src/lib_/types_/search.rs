use std::collections::HashMap;

use validator::ValidationErrors;

use super::filters::{FieldFilters, IndexFilters, WhereFilters};

#[derive(Debug)]
pub struct SearchQuery {
    pub page: Option<usize>,
    pub size: Option<usize>,
    pub order_by: Option<Vec<String>>,
    pub select: Option<Vec<String>>,
    pub where_: Option<WhereFilters>,
}

impl SearchQuery {
    pub fn id(id: u32) -> Self {
        let id_filter = IndexFilters {
            eq: Some(id),
            ne: None,
            null: None,
            in_: None,
            nin: None,
        };
        let filter = FieldFilters::Index(id_filter);
        let filters = HashMap::from([("id".to_string(), filter)]);
        Self {
            page: None,
            size: None,
            order_by: None,
            select: None,
            where_: Some(filters),
        }
    }
}

pub trait ToSearchQuery {
    fn to_search_query(self) -> Result<SearchQuery, ValidationErrors>;
}

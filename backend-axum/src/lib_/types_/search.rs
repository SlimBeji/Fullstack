use std::collections::HashMap;

use validator::ValidationErrors;

use super::filters::{FieldFilters, IndexFilters, WhereFilters};

#[derive(Debug)]
pub struct SearchQuery<Selectable, Sortable> {
    pub page: Option<usize>,
    pub size: Option<usize>,
    pub select: Option<Vec<Selectable>>,
    pub order_by: Option<Vec<Sortable>>,
    pub where_: Option<WhereFilters>,
}

impl<Selectable, Sortable> SearchQuery<Selectable, Sortable> {
    pub fn id(id: i32) -> Self {
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
    type Selectable;
    type Sortable;

    fn to_search_query(
        self,
    ) -> Result<SearchQuery<Self::Selectable, Self::Sortable>, ValidationErrors>;
}

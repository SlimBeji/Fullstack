use std::collections::HashMap;

use validator::ValidationErrors;

use crate::lib_::types_::SearchableTrait;

use super::filters::{FieldFilters, WhereFilters};

#[derive(Debug)]
pub struct SearchQuery<Selectable, Searchable, Sortable> {
    pub page: Option<usize>,
    pub size: Option<usize>,
    pub select: Option<Vec<Selectable>>,
    pub order_by: Option<Vec<Sortable>>,
    pub where_: Option<WhereFilters<Searchable>>,
}

impl<Selectable, Searchable, Sortable> SearchQuery<Selectable, Searchable, Sortable>
where
    Searchable: SearchableTrait,
{
    pub fn id(id: u32) -> Self {
        let filter = FieldFilters::id(id);
        let filters = HashMap::from([(Searchable::id(), filter)]);
        Self {
            page: None,
            size: None,
            order_by: None,
            select: None,
            where_: Some(filters),
        }
    }
}

pub type SearchQueryResult<Selectable, Searchable, Sortable> =
    Result<SearchQuery<Selectable, Searchable, Sortable>, ValidationErrors>;

pub trait ToSearchQuery
where
    Self::Searchable: SearchableTrait,
{
    type Selectable;
    type Searchable;
    type Sortable;

    fn to_search_query(
        self,
    ) -> SearchQueryResult<Self::Selectable, Self::Searchable, Self::Sortable>;
}

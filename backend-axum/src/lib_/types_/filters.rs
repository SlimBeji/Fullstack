use std::collections::HashMap;
use validator::ValidationErrors;

use crate::lib_::validator_::FieldFilters;

#[derive(Debug)]
pub struct FindQuery {
    pub page: usize,
    pub size: usize,
    pub sort: Vec<String>,
    pub fields: Vec<String>,
    pub filters: HashMap<String, FieldFilters>,
}

pub trait ToFindQuery {
    fn to_find_query(self) -> Result<FindQuery, ValidationErrors>;
}

use crate::config;
use crate::lib_::seaorm_::{CrudsBase, CrudsOptionsTrait, CrudsUtils, impl_cruds_boilerplate};
use crate::lib_::types_::SearchQuery;

use crate::models::orm::place;
use crate::models::schemas::{PlaceSearchable, PlaceSelectable, PlaceSortable};
use crate::services::instances::AppState;

// Cruds types

pub type PlaceSearch = SearchQuery<PlaceSelectable, PlaceSearchable, PlaceSortable>;

#[derive(Debug, Default)]
pub struct PlaceOptions {
    pub process: Option<bool>,
    pub fields: Option<Vec<PlaceSelectable>>,
}

impl CrudsOptionsTrait<PlaceSelectable> for PlaceOptions {
    fn process(&self) -> bool {
        self.process.is_some_and(|v| v)
    }

    fn fields(&self) -> Option<Vec<PlaceSelectable>> {
        self.fields.clone()
    }
}

// The Basic Cruds struct

pub type CrudsPlace = CrudsBase<AppState, place::Entity>;

// The CrudUtils Trait

impl CrudsUtils for CrudsPlace {
    impl_cruds_boilerplate!(
        model: place,
        name: "Place",
        primary_key: place::Column::Id,
        selectable: PlaceSelectable,
        searchable: PlaceSearchable,
        sortable: PlaceSortable,
        options: PlaceOptions,
    );

    // Query building helpers

    fn get_max_items_per_page() -> usize {
        config::ENV.max_items_per_page
    }

    fn get_default_select() -> Vec<Self::Selectable> {
        vec![
            PlaceSelectable::Id,
            PlaceSelectable::Title,
            PlaceSelectable::Description,
            PlaceSelectable::Address,
            PlaceSelectable::Location,
            PlaceSelectable::ImageUrl,
            PlaceSelectable::CreatorId,
            PlaceSelectable::CreatedAt,
        ]
    }

    fn to_columns(selects: Vec<Self::Selectable>) -> Vec<Self::Column> {
        let mut result = vec![];
        for select in selects {
            match select {
                PlaceSelectable::Id => result.push(place::Column::Id),
                PlaceSelectable::Title => result.push(place::Column::Title),
                PlaceSelectable::Description => result.push(place::Column::Description),
                PlaceSelectable::Address => result.push(place::Column::Address),
                PlaceSelectable::Location => result.push(place::Column::Location),
                PlaceSelectable::ImageUrl => result.push(place::Column::ImageUrl),
                PlaceSelectable::CreatorId => result.push(place::Column::CreatorId),
                PlaceSelectable::CreatedAt => result.push(place::Column::CreatedAt),
            }
        }
        result
    }

    fn get_default_sort() -> Vec<Self::Sortable> {
        vec![PlaceSortable::CreatedAtDesc]
    }
}

use sea_orm::entity::prelude::async_trait::async_trait;
use serde_json::Value;

use crate::config;
use crate::lib_::seaorm_::{
    CrudsBase, CrudsOptionsTrait, CrudsUtils, Read, RecordReader, impl_cruds_boilerplate,
};
use crate::lib_::types_::{ApiError, FieldFilters, SearchQuery};
use crate::lib_::utils;
use crate::models::orm::place;
use crate::models::schemas::place::Location;
use crate::models::schemas::{
    LOCATION_LAT, LOCATION_LNG, PlaceRead, PlaceSearchable, PlaceSelectable, PlaceSortable,
    UserRead,
};
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

// The Read Trait

pub struct PlaceReader {
    places: Vec<Value>,
}

impl PlaceReader {
    fn to_place(value: &Value) -> Result<PlaceRead, ApiError> {
        let id = CrudsPlace::get_id_from_json(PlaceSelectable::Id.into(), value)?;
        let title = CrudsPlace::get_string_from_json(PlaceSelectable::Title.into(), value)?;
        let description =
            CrudsPlace::get_string_from_json(PlaceSelectable::Description.into(), value)?;
        let address = CrudsPlace::get_string_from_json(PlaceSelectable::Address.into(), value)?;
        let image_url = CrudsPlace::get_string_from_json(PlaceSelectable::ImageUrl.into(), value)?;
        let creator_id = CrudsPlace::get_id_from_json(PlaceSelectable::CreatorId.into(), value)?;
        let created_at =
            CrudsPlace::get_datetime_from_json(PlaceSelectable::CreatedAt.into(), value)?;

        let location_raw =
            CrudsPlace::get_value_from_json(PlaceSelectable::Location.into(), value)?;
        let lat = CrudsPlace::get_f64_from_json(LOCATION_LAT, location_raw)?;
        let lng = CrudsPlace::get_f64_from_json(LOCATION_LNG, location_raw)?;

        Ok(PlaceRead {
            id,
            title,
            description,
            address,
            location: Location { lat, lng },
            image_url,
            creator_id,
            created_at,
        })
    }
}

impl RecordReader for PlaceReader {
    type Read = PlaceRead;
    type Cruds = CrudsPlace;

    fn build_with_no_relations(records: Vec<Value>) -> Self {
        Self { places: records }
    }

    fn read(self) -> Result<Vec<Self::Read>, ApiError> {
        self.places.iter().map(Self::to_place).collect()
    }

    fn read_json(self) -> Result<Vec<Value>, ApiError> {
        Ok(self.places)
    }
}

#[async_trait]
impl Read for CrudsPlace {
    type User = UserRead;
    type Read = PlaceRead;
    type Reader = PlaceReader;

    async fn auth_get(user: &Self::User, mut search: PlaceSearch) -> Result<PlaceSearch, ApiError> {
        let mut where_ = search.where_.take().unwrap_or_default();
        where_.insert(PlaceSearchable::CreatorId, FieldFilters::id(user.id));
        search.where_ = Some(where_);
        Ok(search)
    }

    async fn post_process(&self, mut data: Self::Read) -> Result<Self::Read, ApiError> {
        data.image_url = self
            .app_state
            .storage
            .get_signed_url(&data.image_url, None)
            .await?;
        Ok(data)
    }

    async fn post_process_partial(&self, mut data: Value) -> Result<Value, ApiError> {
        let key: &'static str = PlaceSelectable::ImageUrl.into();
        let result = utils::get_opt_string_from_json(key, &data)
            .map_err(|err| Self::serialization_error(Some(Box::new(err))))?;
        let Some(image_url) = result else {
            return Ok(data);
        };

        data[key] = Value::String(
            self.app_state
                .storage
                .get_signed_url(&image_url, None)
                .await?,
        );
        Ok(data)
    }

    async fn fetch_relations(
        &self,
        _: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        _: &mut Self::Reader,
    ) -> Result<(), ApiError> {
        Ok(())
    }
}

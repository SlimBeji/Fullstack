use std::collections::HashMap;

use reqwest::StatusCode;
use sea_orm::ActiveValue::Set;
use sea_orm::entity::prelude::async_trait::async_trait;
use sea_orm::{
    ColumnTrait, DatabaseTransaction, EntityTrait, IdenStatic, QueryFilter, QuerySelect,
};
use serde_json::Value;

use crate::background::publishers;
use crate::config;
use crate::lib_::seaorm_::{
    Create, CrudsBase, CrudsOptionsTrait, CrudsUtils, Delete, Read, RecordReader, Search, Update,
    impl_cruds_boilerplate,
};
use crate::lib_::types_::{ApiError, FieldFilters, SearchQuery};
use crate::lib_::utils;
use crate::models::cruds::user_exists;
use crate::models::orm::{PLACE_MODEL, place};
use crate::models::schemas::place::PlaceUpdate;
use crate::models::schemas::{
    LOCATION_LAT, LOCATION_LNG, Location, PlaceCreate, PlacePost, PlacePut, PlaceRead,
    PlaceSearchable, PlaceSelectable, PlaceSortable, UserRead,
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
        name: PLACE_MODEL,
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
        where_.insert(PlaceSearchable::CreatorId, FieldFilters::id_eq(user.id));
        search.where_ = Some(where_);
        Ok(search)
    }

    async fn post_process(&self, mut data: Self::Read) -> Result<Self::Read, ApiError> {
        if data.image_url.is_empty() {
            return Ok(data);
        }

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
        if image_url.is_empty() {
            return Ok(data);
        }

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

// The Create Trait

pub struct PlaceCreateContext {}

#[async_trait]
impl Create for CrudsPlace {
    type Post = PlacePost;
    type Create = PlaceCreate;
    type CreateContext = PlaceCreateContext;

    async fn auth_post(&self, user: &Self::User, form: &Self::Post) -> Result<(), ApiError> {
        // For admins, we need to check the creator does exists
        if user.is_admin {
            if user_exists(self.get_db(), form.creator_id).await? {
                return Ok(());
            } else {
                return Err(ApiError {
                    code: StatusCode::NOT_FOUND,
                    message: "User not found".to_string(),
                    details: Some(Value::String(format!(
                        "cannot set creator_id to {}. no user with id {} found in the database",
                        form.creator_id, form.creator_id
                    ))),
                    err: None,
                });
            }
        }

        // for normal users, we check they are posting with their actual id
        if user.id != form.creator_id {
            return Err(ApiError {
                code: StatusCode::UNAUTHORIZED,
                message: "Not Authorized".to_string(),
                details: Some(Value::String(format!(
                    "cannot add places to user {}",
                    form.creator_id
                ))),
                err: None,
            });
        }

        Ok(())
    }

    async fn post_to_create(&self, form: Self::Post) -> Result<Self::Create, ApiError> {
        let mut image_url = "".to_string();
        if let Some(file_to_upload) = form.image {
            image_url = self
                .get_base()
                .app_state
                .storage
                .upload_file(file_to_upload, None)
                .await?;
        }

        Ok(PlaceCreate {
            title: form.title,
            description: form.description,
            address: form.address,
            location: Location {
                lat: form.lat,
                lng: form.lng,
            },
            image_url: Some(image_url),
            embedding: None,
            creator_id: form.creator_id,
        })
    }

    fn create_to_model(data: &Self::Create) -> Self::ActiveModel {
        let location = place::Location {
            lat: data.location.lat,
            lng: data.location.lng,
        };
        Self::ActiveModel {
            title: Set(data.title.clone()),
            description: Set(data.description.clone()),
            address: Set(data.address.clone()),
            image_url: Set(data.image_url.clone().unwrap_or_default()),
            location: Set(location),
            creator_id: Set(data.creator_id as i32),
            ..Default::default()
        }
    }

    async fn before_create(
        &self,
        _: &DatabaseTransaction,
        _: &Self::Create,
    ) -> Result<Self::CreateContext, ApiError> {
        Ok(Self::CreateContext {})
    }

    async fn after_create(
        &self,
        _: &DatabaseTransaction,
        id: u32,
        _: &Self::Create,
        _: Self::CreateContext,
    ) -> Result<(), ApiError> {
        publishers::place_embedding(&self.app_state.publisher, id).await
    }
}

// The Update Trait

pub struct PlaceUpdateContext {
    trigger_embedding: bool,
}

#[async_trait]
impl Update for CrudsPlace {
    type Put = PlacePut;
    type Update = PlaceUpdate;
    type UpdateContext = PlaceUpdateContext;

    async fn auth_put(&self, user: &Self::User, id: u32, _: &Self::Put) -> Result<(), ApiError> {
        // No checks for admins
        if user.is_admin {
            return Ok(());
        }

        // For normal users, we check the place is owned by the user
        let mut where_ = HashMap::new();
        where_.insert(PlaceSearchable::Id, FieldFilters::id_eq(id));
        where_.insert(PlaceSearchable::CreatorId, FieldFilters::id_eq(user.id));
        if !self.exists(&where_).await? {
            return Err(ApiError::unauthorized(format!(
                "Access to place with id {} not granted",
                id
            )));
        }

        Ok(())
    }

    async fn put_to_update(&self, form: Self::Put) -> Result<Self::Update, ApiError> {
        Ok(form)
    }

    fn update_to_model(id: u32, data: &Self::Update) -> Self::ActiveModel {
        let mut model = place::ActiveModel {
            id: Set(id as i32),
            ..Default::default()
        };

        if let Some(title) = &data.title {
            model.title = Set(title.clone());
        }
        if let Some(description) = &data.description {
            model.description = Set(description.clone());
        }
        if let Some(address) = &data.address {
            model.address = Set(address.clone());
        }
        if let Some(location) = &data.location {
            model.location = Set(place::Location {
                lat: location.lat,
                lng: location.lng,
            })
        }

        model
    }

    async fn before_update(
        &self,
        db: &DatabaseTransaction,
        id: u32,
        data: &Self::Update,
    ) -> Result<Self::UpdateContext, ApiError> {
        let value = place::Entity::find()
            .select_only()
            .columns(vec![place::Column::Title, place::Column::Description])
            .filter(place::Column::Id.eq(id as i32))
            .into_json()
            .one(db)
            .await
            .map_err(|e| Self::update_error(id, data, e))?
            .ok_or(Self::id_not_found(id))?;

        let mut title_changed = false;
        let title = Self::get_string_from_json(place::Column::Title.as_str(), &value)?;
        if let Some(new_title) = &data.title {
            title_changed = title.as_str() != new_title;
        }

        let mut description_changed = false;
        let description = Self::get_string_from_json(place::Column::Description.as_str(), &value)?;
        if let Some(new_description) = &data.description {
            description_changed = description.as_str() != new_description;
        }

        Ok(PlaceUpdateContext {
            trigger_embedding: title_changed || description_changed,
        })
    }

    async fn after_update(
        &self,
        _: &DatabaseTransaction,
        id: u32,
        _: &Self::Update,
        hooks_data: Self::UpdateContext,
    ) -> Result<(), ApiError> {
        if hooks_data.trigger_embedding {
            return publishers::place_embedding(&self.app_state.publisher, id).await;
        }
        Ok(())
    }
}

// The Delete Trait

pub struct PlaceDeleteContext {
    pub image_url: String,
}

#[async_trait]
impl Delete for CrudsPlace {
    type DeleteContext = PlaceDeleteContext;

    async fn auth_delete(&self, user: &Self::User, id: u32) -> Result<(), ApiError> {
        // No checks for admins
        if user.is_admin {
            return Ok(());
        }

        // For normal users, we check the place is owned by the user
        let mut where_ = HashMap::new();
        where_.insert(PlaceSearchable::Id, FieldFilters::id_eq(id));
        where_.insert(PlaceSearchable::CreatorId, FieldFilters::id_eq(user.id));
        if !self.exists(&where_).await? {
            return Err(ApiError::unauthorized(format!(
                "Access to place with id {} not granted",
                id
            )));
        }

        Ok(())
    }

    async fn before_delete(
        &self,
        tx: &DatabaseTransaction,
        id: u32,
    ) -> Result<PlaceDeleteContext, ApiError> {
        let value = place::Entity::find()
            .filter(place::Column::Id.eq(id as i32))
            .select_only()
            .column(place::Column::ImageUrl)
            .into_json()
            .one(tx)
            .await
            .map_err(Self::read_error)?
            .ok_or(Self::id_not_found(id))?;
        let image_url = Self::get_string_from_json(place::Column::ImageUrl.as_str(), &value)?;
        Ok(PlaceDeleteContext { image_url })
    }

    async fn after_delete(
        &self,
        _: &DatabaseTransaction,
        _: u32,
        data: Self::DeleteContext,
    ) -> Result<(), ApiError> {
        if !data.image_url.is_empty() {
            self.app_state.storage.delete_file(&data.image_url).await?;
        }
        Ok(())
    }
}

// The Search Trait

#[async_trait]
impl Search for CrudsPlace {}

// Embeding Helpers

impl CrudsPlace {
    async fn update_embedding(&self, id: u32, vector: Vec<f32>) -> Result<(), ApiError> {
        let model = place::ActiveModel {
            id: Set(id as i32),
            embedding: Set(Some(vector.into())),
            ..Default::default()
        };
        place::Entity::update(model)
            .exec(self.get_db())
            .await
            .map_err(|e| {
                ApiError::internal_error(
                    "failed to update place embedding".to_string(),
                    Box::new(e),
                )
            })?;
        Ok(())
    }

    pub async fn seed(&self, data: PlaceCreate, vector: Vec<f32>) -> Result<u32, ApiError> {
        let model = Self::create_to_model(&data);
        let insert_result = place::Entity::insert(model)
            .exec(self.get_db())
            .await
            .map_err(|err| {
                ApiError::internal_error("failed to seed place".to_string(), Box::new(err))
            })?;
        let id = insert_result.last_insert_id as u32;
        self.update_embedding(id, vector).await?;
        Ok(id)
    }

    pub async fn embed(&self, id: u32) -> Result<Vec<f32>, ApiError> {
        // Fetch the title + description
        let value = place::Entity::find()
            .select_only()
            .columns(vec![place::Column::Title, place::Column::Description])
            .filter(place::Column::Id.eq(id as i32))
            .into_json()
            .one(self.get_db())
            .await
            .map_err(Self::read_error)?
            .ok_or(Self::id_not_found(id))?;

        // Run embedding
        let title = Self::get_string_from_json(place::Column::Title.as_str(), &value)?;
        let description = Self::get_string_from_json(place::Column::Description.as_str(), &value)?;
        let text = format!("{} - {}", title, description);
        self.app_state.hf.embed_text(&text).await
    }
}

use std::marker::PhantomData;

use sea_orm::{
    DatabaseConnection, EntityTrait, PrimaryKeyTrait, prelude::async_trait::async_trait,
};
use serde_json::Value;

use crate::lib_::types_::{ApiError, SearchQuery};

// Cruds generic struct
pub struct CrudsBase<Entity, Selectable, Sortable>
where
    Entity: EntityTrait,
{
    _entity: PhantomData<Entity>,
    pub db: DatabaseConnection,
    pub max_items_per_page: usize,
    pub default_select: Vec<Selectable>,
    pub default_order_by: Vec<Sortable>,
}

impl<Entity, Selectable, Sortable> CrudsBase<Entity, Selectable, Sortable>
where
    Entity: EntityTrait,
{
    pub fn build(
        db: DatabaseConnection,
        max_items_per_page: usize,
        default_select: Vec<Selectable>,
        default_order_by: Vec<Sortable>,
    ) -> Self {
        Self {
            _entity: PhantomData,
            db,
            max_items_per_page,
            default_select,
            default_order_by,
        }
    }

    pub fn tablename(&self) -> &'static str {
        Entity::default().table_name()
    }
}

// CrudsTools
pub trait CrudsTools
where
    <Self::Entity as EntityTrait>::Model: Send + Sync,
    <<Self::Entity as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType: From<i32>,
{
    type Entity: EntityTrait; // The SearOrm Entity
    type Selectable: Send + Sync + Copy + 'static; // The enum for selectable fields
    type Sortable: Send + Sync + Copy + 'static; // The enum for sortable fields

    fn get_base(&self) -> &CrudsBase<Self::Entity, Self::Selectable, Self::Sortable>;
    fn get_modelname() -> &'static str;
}

// Read traits
#[async_trait]
pub trait Read: CrudsTools {
    type User: Send + Sync + 'static; // User object for authentication and authorization
    type Fetch: Send + Sync; // The Data fetched
    type Read: Send + Sync; // The Read Struct

    async fn auth_get(user: Self::User, search: &mut SearchQuery<Self::Selectable, Self::Sortable>);

    fn to_read(data: Self::Fetch) -> Result<Self::Read, ApiError>;

    fn to_json(data: Self::Fetch) -> Result<Value, ApiError>;

    async fn post_process(data: &Self::Read) -> Result<(), ApiError>;

    async fn post_process_partial(data: &Value) -> Result<(), ApiError>;

    async fn get_raw(
        &self,
        query: SearchQuery<Self::Selectable, Self::Sortable>,
    ) -> Result<Self::Fetch, ApiError>;

    async fn get_raw_for_read(
        &self,
        mut query: SearchQuery<Self::Selectable, Self::Sortable>,
    ) -> Result<Self::Fetch, ApiError> {
        query.select = Some(self.get_base().default_select.clone());
        self.get_raw(query).await
    }

    async fn read(
        &self,
        id: i32,
    ) -> Result<Option<<Self::Entity as EntityTrait>::Model>, ApiError> {
        let base = self.get_base();
        Self::Entity::find_by_id(id)
            .one(&base.db)
            .await
            .map_err(|e| {
                ApiError::internal_error(
                    format!(
                        "could not extract {} with id {} from database",
                        Self::get_modelname(),
                        id
                    ),
                    Box::new(e),
                )
            })
    }

    async fn get(&self, id: u32) -> Result<Self::Read, ApiError> {
        let query = SearchQuery::id(id);
        let raw = self.get_raw_for_read(query).await?;
        let data = Self::to_read(raw)?;
        Self::post_process(&data).await?;
        Ok(data)
    }

    async fn user_get(&self, user: Self::User, id: u32) -> Result<Self::Read, ApiError> {
        let mut query = SearchQuery::id(id);
        Self::auth_get(user, &mut query).await;
        let raw = self.get_raw_for_read(query).await?;
        let data = Self::to_read(raw)?;
        Self::post_process(&data).await?;
        Ok(data)
    }

    async fn get_partial(&self, id: u32) -> Result<Value, ApiError> {
        let query = SearchQuery::id(id);
        let raw = self.get_raw(query).await?;
        let data = Self::to_json(raw)?;
        Self::post_process_partial(&data).await?;
        Ok(data)
    }

    async fn user_get_partial(&self, user: Self::User, id: u32) -> Result<Value, ApiError> {
        let mut query = SearchQuery::id(id);
        Self::auth_get(user, &mut query).await;
        let raw = self.get_raw(query).await?;
        let data = Self::to_json(raw)?;
        Self::post_process_partial(&data).await?;
        Ok(data)
    }
}

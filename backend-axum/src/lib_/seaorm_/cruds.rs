use std::marker::PhantomData;

use sea_orm::{
    DatabaseConnection, EntityTrait, Order, PrimaryKeyTrait, prelude::async_trait::async_trait,
};
use serde_json::Value;

use crate::lib_::types_::{ApiError, SearchQuery};

// Cruds generci struct
pub struct CrudsBase<E: EntityTrait> {
    _entity: PhantomData<E>,
    pub db: DatabaseConnection,
    pub max_items_per_page: usize,
    pub default_select: Vec<E::Column>,
    pub default_order_by: Vec<(E::Column, Order)>,
}

impl<E: EntityTrait> CrudsBase<E> {
    pub fn new(
        db: DatabaseConnection,
        max_items_per_page: usize,
        default_select: Vec<E::Column>,
        default_order_by: Vec<(E::Column, Order)>,
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
        E::default().table_name()
    }
}

// CrudsTools
pub trait CrudsTools<E>
where
    E: EntityTrait,
{
    fn get_base(&self) -> &CrudsBase<E>;
    fn get_modelname() -> &'static str;
}

// Read traits
#[async_trait]
pub trait Read<User, Entity, Fetch, Read>: CrudsTools<Entity>
where
    // User object for authentication and authorization
    User: Send + Sync + 'static,
    // The SearOrm Entity
    Entity: EntityTrait,
    Entity::Model: Send + Sync,
    <Entity::PrimaryKey as PrimaryKeyTrait>::ValueType: From<u32>,
    // The Data fetched
    Fetch: Send + Sync,
    // The Read Struct
    Read: Send + Sync,
{
    async fn auth_get(user: User, search: SearchQuery) -> SearchQuery;

    fn to_read(model: Fetch) -> Result<Read, ApiError>;

    fn to_json(model: Fetch) -> Result<Value, ApiError>;

    async fn post_process(data: &Read) -> Result<(), ApiError>;

    async fn post_process_partial(data: &Value) -> Result<(), ApiError>;

    async fn get_raw(&self, query: SearchQuery) -> Result<Fetch, ApiError>;

    async fn get_raw_for_read(&self, query: SearchQuery) -> Result<Fetch, ApiError> {
        //query.select = Some(self.get_base().default_select);
        self.get_raw(query).await
    }

    async fn read(&self, id: u32) -> Result<Option<Entity::Model>, ApiError> {
        let base = self.get_base();
        Entity::find_by_id(id).one(&base.db).await.map_err(|e| {
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

    async fn get(&self, id: u32) -> Result<Read, ApiError> {
        let query = SearchQuery::id(id);
        let raw = self.get_raw_for_read(query).await?;
        let data = Self::to_read(raw)?;
        Self::post_process(&data).await?;
        Ok(data)
    }

    async fn user_get(&self, user: User, id: u32) -> Result<Read, ApiError> {
        let query = Self::auth_get(user, SearchQuery::id(id)).await;
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

    async fn user_get_partial(&self, user: User, id: u32) -> Result<Value, ApiError> {
        let query = Self::auth_get(user, SearchQuery::id(id)).await;
        let raw = self.get_raw(query).await?;
        let data = Self::to_json(raw)?;
        Self::post_process_partial(&data).await?;
        Ok(data)
    }
}

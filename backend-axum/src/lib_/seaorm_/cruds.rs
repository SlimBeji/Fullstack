use std::marker::PhantomData;

use axum::http::StatusCode;
use sea_orm::{
    DatabaseConnection, EntityTrait, PrimaryKeyTrait, prelude::async_trait::async_trait,
};
use serde_json::Value;

use crate::lib_::types_::{ApiError, SearchQuery};

// State contract
pub trait CrudAppStateTrait {
    fn get_db(&self) -> &DatabaseConnection;
}

// Cruds generic struct
pub struct CrudsBase<State, Entity, Selectable, Sortable>
where
    State: CrudAppStateTrait,
    Entity: EntityTrait,
{
    _entity: PhantomData<Entity>,
    pub app_state: State,
    pub max_items_per_page: usize,
    pub default_select: Vec<Selectable>,
    pub default_order_by: Vec<Sortable>,
}

impl<State, Entity, Selectable, Sortable> CrudsBase<State, Entity, Selectable, Sortable>
where
    State: CrudAppStateTrait,
    Entity: EntityTrait,
{
    pub fn build(
        app_state: State,
        max_items_per_page: usize,
        default_select: Vec<Selectable>,
        default_order_by: Vec<Sortable>,
    ) -> Self {
        Self {
            _entity: PhantomData,
            app_state,
            max_items_per_page,
            default_select,
            default_order_by,
        }
    }

    pub fn get_db(&self) -> &DatabaseConnection {
        self.app_state.get_db()
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
    type State: CrudAppStateTrait + Send + Sync; // The app state
    type Entity: EntityTrait; // The SearOrm Entity
    type Selectable: Send + Sync + Copy + 'static; // The enum for selectable fields
    type Sortable: Send + Sync + Copy + 'static; // The enum for sortable fields

    fn get_base(&self) -> &CrudsBase<Self::State, Self::Entity, Self::Selectable, Self::Sortable>;

    fn get_modelname() -> &'static str;

    fn serialization_error() -> ApiError {
        ApiError {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: "serialization failure".to_string(),
            details: Some(Value::String(format!(
                "could not serialie {} record",
                Self::get_modelname()
            ))),
            err: None,
        }
    }

    fn not_found() -> ApiError {
        ApiError {
            code: StatusCode::NOT_FOUND,
            message: format!("{} object not found", Self::get_modelname()),
            details: None,
            err: None,
        }
    }

    fn update_not_found_with_id(err: ApiError, id: u32) -> ApiError {
        if err.code != StatusCode::NOT_FOUND {
            return err;
        }

        ApiError {
            code: StatusCode::NOT_FOUND,
            message: err.message,
            details: Some(Value::String(format!("no record with id {} found", id))),
            err: None,
        }
    }
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

    async fn post_process(&self, data: &mut Self::Read) -> Result<(), ApiError>;

    async fn post_process_partial(&self, data: &mut Value) -> Result<(), ApiError>;

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
            .one(base.get_db())
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
        let raw = self
            .get_raw_for_read(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_read(raw)?;
        self.post_process(&mut data).await?;
        Ok(data)
    }

    async fn user_get(&self, user: Self::User, id: u32) -> Result<Self::Read, ApiError> {
        let mut query = SearchQuery::id(id);
        Self::auth_get(user, &mut query).await;
        let raw = self
            .get_raw_for_read(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_read(raw)?;
        self.post_process(&mut data).await?;
        Ok(data)
    }

    async fn get_partial(&self, id: u32) -> Result<Value, ApiError> {
        let query = SearchQuery::id(id);
        let raw = self
            .get_raw(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_json(raw)?;
        self.post_process_partial(&mut data).await?;
        Ok(data)
    }

    async fn user_get_partial(&self, user: Self::User, id: u32) -> Result<Value, ApiError> {
        let mut query = SearchQuery::id(id);
        Self::auth_get(user, &mut query).await;
        let raw = self
            .get_raw(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_json(raw)?;
        self.post_process_partial(&mut data).await?;
        Ok(data)
    }
}

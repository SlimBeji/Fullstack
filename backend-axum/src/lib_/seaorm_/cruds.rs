use std::marker::PhantomData;

use axum::http::StatusCode;
use sea_orm::{
    ColumnTrait, Condition, DatabaseConnection, EntityName, EntityTrait, PrimaryKeyTrait,
    QueryFilter, QuerySelect, Select, prelude::async_trait::async_trait,
};
use serde_json::Value;

use crate::lib_::{
    seaorm_::to_condition,
    types_::{ApiError, SearchQuery, SearchableTrait},
};

// Cruds general tools
pub trait CrudAppStateTrait {
    fn get_db(&self) -> &DatabaseConnection;
}

pub struct CrudsBase<State, Entity>
where
    State: CrudAppStateTrait,
    Entity: EntityTrait,
{
    _entity: PhantomData<Entity>,
    pub app_state: State,
}

pub trait CrudsTools
where
    <Self::Entity as EntityTrait>::Model: Send + Sync,
    <<Self::Entity as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType: From<i32>,
{
    // Associated types

    type State: CrudAppStateTrait + Send + Sync; // The app state
    type Entity: EntityTrait; // The SearOrm Entity
    type Column: ColumnTrait; // The SeaOrm associated Column type
    type Selectable: Send + Sync + Copy + 'static; // The enum for selectable fields
    type Searchable: Send + Sync + Copy + SearchableTrait + 'static; // The enum for searchable fields
    type Sortable: Send + Sync + Copy + 'static; // The enum for sortable fields

    // Constructor and properties

    fn new(app_state: Self::State) -> CrudsBase<Self::State, Self::Entity> {
        CrudsBase {
            _entity: PhantomData,
            app_state,
        }
    }

    fn get_base(&self) -> &CrudsBase<Self::State, Self::Entity>;

    fn get_db(&self) -> &DatabaseConnection {
        self.get_base().app_state.get_db()
    }

    fn get_modelname() -> &'static str;

    fn tablename(&self) -> &'static str {
        Self::Entity::default().table_name()
    }

    // Error handling helpers

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

    // Query building helpers

    fn get_max_items_per_page() -> usize;

    fn get_default_select() -> Vec<Self::Selectable>;

    fn get_select(
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Vec<Self::Selectable> {
        let Some(select) = query.select.clone() else {
            return Self::get_default_select();
        };
        select
    }

    fn to_columns(selects: Vec<Self::Selectable>) -> Vec<Self::Column>;

    fn get_condition(
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Option<Condition> {
        query.where_.as_ref().map(|w| to_condition(w))
    }

    fn get_pagination(
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> (usize, usize) {
        let page = query.page.unwrap_or(1);
        let size = query.size.unwrap_or(Self::get_max_items_per_page());
        (page, size)
    }

    fn to_select_one(
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Select<Self::Entity> {
        let columns = Self::to_columns(Self::get_select(&query));
        let mut q = Self::Entity::find().select_only().columns(columns);
        if let Some(condition) = Self::get_condition(&query) {
            q = q.filter(condition);
        }
        q
    }
}

// Read traits
#[async_trait]
pub trait Read: CrudsTools {
    type User: Send + Sync + 'static; // User object for authentication and authorization
    type Fetch: Send + Sync; // The Data fetched
    type Read: Send + Sync; // The Read Struct

    async fn auth_get(
        user: Self::User,
        search: &mut SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    );

    fn to_read(data: Self::Fetch) -> Result<Self::Read, ApiError>;

    fn to_json(data: Self::Fetch) -> Result<Value, ApiError>;

    async fn post_process(&self, data: &mut Self::Read) -> Result<(), ApiError>;

    async fn post_process_partial(&self, data: &mut Value) -> Result<(), ApiError>;

    async fn get_raw(
        &self,
        query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Self::Fetch, ApiError>;

    async fn get_raw_for_read(
        &self,
        mut query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Self::Fetch, ApiError> {
        query.select = Some(Self::get_default_select());
        self.get_raw(query).await
    }

    async fn read(
        &self,
        id: i32,
    ) -> Result<Option<<Self::Entity as EntityTrait>::Model>, ApiError> {
        Self::Entity::find_by_id(id)
            .one(self.get_db())
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

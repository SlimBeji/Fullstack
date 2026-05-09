use std::marker::PhantomData;

use axum::http::StatusCode;
use sea_orm::{
    ActiveModelBehavior, ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection,
    DatabaseTransaction, DbErr, EntityName, EntityTrait, IntoActiveModel, PrimaryKeyTrait,
    QueryFilter, QuerySelect, RuntimeErr, TransactionError, TransactionTrait,
    prelude::async_trait::async_trait,
};
use serde_json::Value;

use crate::lib_::{
    clients::{CloudStorage, PgClient, RedisClient},
    seaorm_::to_condition,
    types_::{ApiError, SearchQuery, SearchableTrait},
    utils,
};

// Traits for types used in CRUDS

pub trait CrudsAppStateTrait {
    fn get_pg(&self) -> &PgClient;
    fn get_redis(&self) -> &RedisClient;
    fn get_storage(&self) -> &CloudStorage;
}

pub trait CrudsOptionsTrait<Selectable> {
    fn process(&self) -> bool;
    fn fields(&self) -> Option<Vec<Selectable>>;
}

// Base CRUDS type

pub struct CrudsBase<State, Entity>
where
    State: CrudsAppStateTrait,
    Entity: EntityTrait,
{
    _entity: PhantomData<Entity>,
    pub app_state: State,
}

impl<State: CrudsAppStateTrait, Entity: EntityTrait> CrudsBase<State, Entity> {
    pub fn new(app_state: State) -> Self {
        Self {
            _entity: PhantomData,
            app_state,
        }
    }
}

// Utils tarit

pub trait CrudsUtils
where
    <Self::Entity as EntityTrait>::Model: Send + Sync,
    <<Self::Entity as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType: From<i32>,
{
    // Associated types

    type State: CrudsAppStateTrait + Send + Sync; // The app state
    type Entity: EntityTrait; // The SearOrm Entity
    type Column: ColumnTrait; // The SeaOrm associated Column type
    type Selectable: Send + Sync + Copy + 'static; // The enum for selectable fields
    type Searchable: Send + Sync + Copy + SearchableTrait + 'static; // The enum for searchable fields
    type Sortable: Send + Sync + Copy + 'static; // The enum for sortable fields
    type Options: Send + Sync + Default + CrudsOptionsTrait<Self::Selectable>; // Common options for cruds methods

    // Properties

    fn get_base(&self) -> &CrudsBase<Self::State, Self::Entity>;

    fn get_db(&self) -> &DatabaseConnection {
        &self.get_base().app_state.get_pg().db
    }

    fn get_modelname() -> &'static str;

    fn tablename(&self) -> &'static str {
        Self::Entity::default().table_name()
    }

    fn extract_id(
        value: <<Self::Entity as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType,
    ) -> u32;

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

    fn read_error(e: DbErr) -> ApiError {
        ApiError::internal_error(
            format!("failed to read {} data", Self::get_modelname()),
            Box::new(e),
        )
    }

    fn create_error(e: DbErr) -> ApiError {
        if let DbErr::Query(RuntimeErr::SqlxError(ref sqlx_err)) = e
            && let Some(pg_err) = sqlx_err.as_database_error()
            && pg_err.code().as_deref() == Some("23505")
        {
            return ApiError {
                code: StatusCode::CONFLICT,
                message: format!("{} already exists", Self::get_modelname()),
                details: None,
                err: None,
            };
        }

        ApiError::internal_error(
            format!("failed to create {} data", Self::get_modelname()),
            Box::new(e),
        )
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
        query.where_.as_ref().map(to_condition)
    }

    fn get_pagination(
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> (usize, usize) {
        let page = query.page.unwrap_or(1);
        let size = query.size.unwrap_or(Self::get_max_items_per_page());
        (page, size)
    }

    // Data extraction

    fn get_id_from_json(key: &str, value: &Value) -> Result<u32, ApiError> {
        let result = utils::get_id_from_json(key, value);
        utils::unwrap_json_value(result, Self::serialization_error())
    }
}

// Read trait

#[async_trait]
pub trait Read: CrudsUtils {
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

    async fn to_select_one(
        &self,
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Value, ApiError> {
        let columns = Self::to_columns(Self::get_select(query));
        let mut q = Self::Entity::find().select_only().columns(columns);
        if let Some(condition) = Self::get_condition(query) {
            q = q.filter(condition);
        }
        let value = q
            .into_json()
            .one(self.get_db())
            .await
            .map_err(Self::read_error)?
            .ok_or(Self::not_found())?;
        Ok(value)
    }

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
        id: u32,
    ) -> Result<Option<<Self::Entity as EntityTrait>::Model>, ApiError> {
        Self::Entity::find_by_id(id as i32)
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

    async fn get(&self, id: u32, options: Option<Self::Options>) -> Result<Self::Read, ApiError> {
        let query = SearchQuery::id(id);
        let raw = self
            .get_raw_for_read(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_read(raw)?;
        if options.is_some_and(|o| o.process()) {
            self.post_process(&mut data).await?;
        }
        Ok(data)
    }

    async fn user_get(
        &self,
        user: Self::User,
        id: u32,
        options: Option<Self::Options>,
    ) -> Result<Self::Read, ApiError> {
        let mut query = SearchQuery::id(id);
        Self::auth_get(user, &mut query).await;
        let raw = self
            .get_raw_for_read(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_read(raw)?;
        if options.is_some_and(|o| o.process()) {
            self.post_process(&mut data).await?;
        }
        Ok(data)
    }

    async fn get_partial(
        &self,
        id: u32,
        options: Option<Self::Options>,
    ) -> Result<Value, ApiError> {
        let mut query = SearchQuery::id(id);
        if let Some(fields) = &options {
            query.select = fields.fields()
        }
        let raw = self
            .get_raw(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_json(raw)?;
        if options.is_some_and(|o| o.process()) {
            self.post_process_partial(&mut data).await?;
        }
        Ok(data)
    }

    async fn user_get_partial(
        &self,
        user: Self::User,
        id: u32,
        options: Option<Self::Options>,
    ) -> Result<Value, ApiError> {
        let mut query = SearchQuery::id(id);
        if let Some(fields) = &options {
            query.select = fields.fields()
        }
        Self::auth_get(user, &mut query).await;
        let raw = self
            .get_raw(query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_json(raw)?;
        if options.is_some_and(|o| o.process()) {
            self.post_process_partial(&mut data).await?;
        }
        Ok(data)
    }
}

// Create trait

#[async_trait]
pub trait Create: Read
where
    <Self::Entity as EntityTrait>::Model: IntoActiveModel<Self::ActiveModel>,
{
    type ActiveModel: ActiveModelTrait<Entity = Self::Entity> + ActiveModelBehavior + Send + 'static; // SeaOrm active model for data creation/update
    type Post: Send + Sync; // The post form received via HTTP
    type Create: Send + Sync + 'static; // The create struct used internally
    type CreateContext: Send + Sync; // The data used in pre/post create hooks

    async fn auth_post(&self, user: &Self::User, form: &Self::Post) -> Result<(), ApiError>;

    async fn post_to_create(form: Self::Post) -> Result<Self::Create, ApiError>;

    fn create_to_model(data: &Self::Create) -> Self::ActiveModel;

    async fn before_create(
        tx: &DatabaseTransaction,
        data: &Self::Create,
    ) -> Result<Self::CreateContext, ApiError>;

    async fn after_create(
        tx: &DatabaseTransaction,
        id: u32,
        data: Self::Create,
        hooks_data: Self::CreateContext,
    ) -> Result<(), ApiError>;

    async fn create(&self, data: Self::Create) -> Result<u32, ApiError> {
        let model = Self::create_to_model(&data);

        let result = self
            .get_db()
            .transaction::<_, u32, ApiError>(|tx| {
                Box::pin(async move {
                    let hooks_data = Self::before_create(tx, &data).await?;
                    let result = Self::Entity::insert(model)
                        .exec(tx)
                        .await
                        .map_err(Self::create_error)?;
                    let id = Self::extract_id(result.last_insert_id);
                    Self::after_create(tx, id, data, hooks_data).await?;
                    Ok(id)
                })
            })
            .await
            .map_err(|e| match e {
                TransactionError::Connection(db_err) => Self::create_error(db_err),
                TransactionError::Transaction(api_err) => api_err,
            })?;

        // better handling of the errors

        Ok(result)
    }

    async fn post(
        &self,
        form: Self::Post,
        options: Option<Self::Options>,
    ) -> Result<Self::Read, ApiError> {
        let data = Self::post_to_create(form).await?;
        let id = self.create(data).await?;
        self.get(id, options).await
    }

    async fn user_post(
        &self,
        user: Self::User,
        form: Self::Post,
        options: Option<Self::Options>,
    ) -> Result<Self::Read, ApiError> {
        self.auth_post(&user, &form).await?;
        self.post(form, options).await
    }
}

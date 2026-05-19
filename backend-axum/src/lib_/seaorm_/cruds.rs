use std::{error::Error, marker::PhantomData, sync::Arc};

use axum::http::StatusCode;
use sea_orm::{
    ActiveModelBehavior, ActiveModelTrait, ColumnTrait, Condition, ConnectionTrait,
    DatabaseConnection, DatabaseTransaction, DbErr, EntityName, EntityTrait, IntoActiveModel,
    PaginatorTrait, PrimaryKeyTrait, QueryFilter, QueryOrder, QuerySelect, RuntimeErr,
    TransactionTrait, prelude::async_trait::async_trait, sqlx,
};
use serde_json::Value;
use sqlx::postgres::PgDatabaseError;
use time::OffsetDateTime;

use crate::lib_::{
    clients::{CloudStorage, PgClient, RedisClient},
    seaorm_::to_condition,
    types_::{ApiError, PaginatedData, SearchQuery, SearchableTrait, SortableTrait, WhereFilters},
    utils::{self, batch_process_with_semaphore},
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
    pub app_state: Arc<State>,
}

impl<State: CrudsAppStateTrait, Entity: EntityTrait> Clone for CrudsBase<State, Entity> {
    fn clone(&self) -> Self {
        Self {
            _entity: PhantomData,
            app_state: self.app_state.clone(),
        }
    }
}

impl<State: CrudsAppStateTrait, Entity: EntityTrait> CrudsBase<State, Entity> {
    pub fn new(app_state: Arc<State>) -> Self {
        Self {
            _entity: PhantomData,
            app_state,
        }
    }
}

// Utils tarit

pub trait CrudsUtils
where
    Self: Clone + Send + 'static,
    <Self::Entity as EntityTrait>::Model: Send + Sync,
    <<Self::Entity as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType: From<i32>,
    <Self::Entity as EntityTrait>::Model: IntoActiveModel<Self::ActiveModel>,
{
    // Associated types

    type State: CrudsAppStateTrait + Send + Sync + 'static; // The app state
    type Entity: EntityTrait; // The SearOrm Entity
    type ActiveModel: ActiveModelTrait<Entity = Self::Entity> + ActiveModelBehavior + Send + 'static; // SeaOrm active model for data creation/update
    type Column: ColumnTrait; // The SeaOrm associated Column type
    type Selectable: Send + Sync + Copy + 'static; // The enum for selectable fields
    type Searchable: Send + Sync + Copy + SearchableTrait + 'static; // The enum for searchable fields
    type Sortable: Send + Sync + Copy + SortableTrait + 'static; // The enum for sortable fields
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

    fn get_primary_key(&self) -> Self::Column;

    fn extract_id(
        value: <<Self::Entity as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType,
    ) -> u32;

    // Error handling helpers

    fn extract_pg_detail(e: &DbErr) -> Option<Value> {
        let DbErr::Query(RuntimeErr::SqlxError(sqlx_err)) = e else {
            return None;
        };
        let sqlx::Error::Database(db_err) = sqlx_err.as_ref() else {
            return None;
        };
        db_err
            .downcast_ref::<PgDatabaseError>()
            .detail()
            .map(|s| Value::String(s.to_string()))
    }

    fn serialization_error(err: Option<Box<dyn Error + Send + Sync>>) -> ApiError {
        ApiError {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: "serialization failure".to_string(),
            details: Some(Value::String(format!(
                "could not serialie {} record(s)",
                Self::get_modelname()
            ))),
            err,
        }
    }

    fn id_not_found(id: u32) -> ApiError {
        ApiError {
            code: StatusCode::NOT_FOUND,
            message: format!("{} object not found", Self::get_modelname()),
            details: Some(Value::String(format!("no record with id {} found", id))),
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

    fn is_duplicate_error(e: &DbErr) -> bool {
        if let DbErr::Query(RuntimeErr::SqlxError(sqlx_err)) = e
            && let Some(pg_err) = sqlx_err.as_database_error()
            && pg_err.code().as_deref() == Some("23505")
        {
            return true;
        }
        false
    }

    fn default_duplicate_error(e: DbErr) -> ApiError {
        ApiError {
            code: StatusCode::CONFLICT,
            message: format!("{} already exists", Self::get_modelname()),
            details: Self::extract_pg_detail(&e),
            err: Some(Box::new(e)),
        }
    }

    // Query building helpers

    fn get_max_items_per_page() -> usize;

    fn get_default_select() -> Vec<Self::Selectable>;

    fn selectables(
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

    fn get_default_sort() -> Vec<Self::Sortable>;

    // Data extraction

    fn get_id_from_json(key: &str, value: &Value) -> Result<u32, ApiError> {
        let result = utils::get_id_from_json(key, value)
            .map_err(|e| Self::serialization_error(Some(Box::new(e))))?;
        Ok(result)
    }

    fn get_f64_from_json(key: &str, value: &Value) -> Result<f64, ApiError> {
        let result = utils::get_f64_from_json(key, value)
            .map_err(|e| Self::serialization_error(Some(Box::new(e))))?;
        Ok(result)
    }

    fn get_string_from_json(key: &str, value: &Value) -> Result<String, ApiError> {
        let result = utils::get_string_from_json(key, value)
            .map_err(|e| Self::serialization_error(Some(Box::new(e))))?;
        Ok(result)
    }

    fn get_bool_from_json(key: &str, value: &Value) -> Result<bool, ApiError> {
        let result = utils::get_bool_from_json(key, value)
            .map_err(|e| Self::serialization_error(Some(Box::new(e))))?;
        Ok(result)
    }

    fn get_datetime_from_json(key: &str, value: &Value) -> Result<OffsetDateTime, ApiError> {
        let result = utils::get_datetime_from_json(key, value)
            .map_err(|e| Self::serialization_error(Some(Box::new(e))))?;
        Ok(result)
    }

    fn get_value_from_json<'a>(key: &str, value: &'a Value) -> Result<&'a Value, ApiError> {
        let result = utils::get_value_from_json(key, value)
            .map_err(|e| Self::serialization_error(Some(Box::new(e))))?;
        Ok(result)
    }
}

// Read trait

pub trait RecordReader {
    type Cruds: CrudsUtils; // Utils with error handling
    type Read: Send + Sync; // The Read Struct

    fn build_with_no_relations(records: Vec<Value>) -> Self;

    fn read(self) -> Result<Vec<Self::Read>, ApiError>;

    fn read_json(self) -> Result<Vec<Value>, ApiError>;
}

#[async_trait]
pub trait Read: CrudsUtils {
    type User: Send + Sync + 'static; // User object for authentication and authorization
    type Read: Send + Sync; // The Read Struct
    type Reader: Send + Sync + RecordReader<Read = Self::Read>; // Container that stores fetched data and reads it

    async fn auth_get(
        user: &Self::User,
        search: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>, ApiError>;

    async fn post_process(&self, data: Self::Read) -> Result<Self::Read, ApiError> {
        Ok(data)
    }

    async fn post_process_partial(&self, data: Value) -> Result<Value, ApiError> {
        Ok(data)
    }

    fn read_error(e: DbErr) -> ApiError {
        ApiError::internal_error(
            format!("failed to read {} data", Self::get_modelname()),
            Box::new(e),
        )
    }

    async fn fetch_relations(
        &self,
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        data: &mut Self::Reader,
    ) -> Result<(), ApiError>;

    async fn select_one(
        &self,
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Value, ApiError> {
        let columns = Self::to_columns(Self::selectables(query));
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

    async fn exists(&self, filters: &WhereFilters<Self::Searchable>) -> Result<bool, ApiError> {
        let result = Self::Entity::find()
            .select_only()
            .column(self.get_primary_key())
            .filter(to_condition(filters))
            .into_json()
            .one(self.get_db())
            .await
            .map_err(|err| ApiError::internal_error("connection lost", Box::new(err)))?;

        Ok(result.is_some())
    }

    async fn get_raw(
        &self,
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Self::Reader, ApiError> {
        let records = vec![self.select_one(query).await?];
        let mut data = Self::Reader::build_with_no_relations(records);
        self.fetch_relations(query, &mut data).await?;
        Ok(data)
    }

    async fn get_raw_for_read(
        &self,
        query: &mut SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Self::Reader, ApiError> {
        query.select = Some(Self::get_default_select());
        self.get_raw(query).await
    }

    async fn get_row_by_id(
        &self,
        conn: &impl ConnectionTrait,
        id: u32,
        columns: Vec<Self::Column>,
    ) -> Result<Value, ApiError> {
        let mut q = Self::Entity::find_by_id(id as i32).select_only();

        for col in columns {
            q = q.column(col);
        }

        q.into_json()
            .one(conn)
            .await
            .map_err(Self::read_error)?
            .ok_or(Self::not_found())
    }

    fn to_read(data: Self::Reader) -> Result<Self::Read, ApiError> {
        let users = data.read()?;
        let user = users.into_iter().next().ok_or(Self::not_found())?;
        Ok(user)
    }

    fn to_json(data: Self::Reader) -> Result<Value, ApiError> {
        let users = data.read_json()?;
        let user = users.into_iter().next().ok_or(Self::not_found())?;
        Ok(user)
    }

    async fn get(&self, id: u32, options: Option<Self::Options>) -> Result<Self::Read, ApiError> {
        let mut query = SearchQuery::id(id);
        let raw = self
            .get_raw_for_read(&mut query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_read(raw)?;
        if options.is_some_and(|o| o.process()) {
            data = self.post_process(data).await?;
        }
        Ok(data)
    }

    async fn user_get(
        &self,
        user: &Self::User,
        id: u32,
        options: Option<Self::Options>,
    ) -> Result<Self::Read, ApiError> {
        let mut query = Self::auth_get(user, SearchQuery::id(id)).await?;
        let raw = self
            .get_raw_for_read(&mut query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_read(raw)?;
        if options.is_some_and(|o| o.process()) {
            data = self.post_process(data).await?;
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
            .get_raw(&query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_json(raw)?;
        if options.is_some_and(|o| o.process()) {
            data = self.post_process_partial(data).await?;
        }
        Ok(data)
    }

    async fn user_get_partial(
        &self,
        user: &Self::User,
        id: u32,
        options: Option<Self::Options>,
    ) -> Result<Value, ApiError> {
        let mut query = Self::auth_get(user, SearchQuery::id(id)).await?;
        if let Some(fields) = &options {
            query.select = fields.fields()
        }
        let raw = self
            .get_raw(&query)
            .await
            .map_err(|err| Self::update_not_found_with_id(err, id))?;
        let mut data = Self::to_json(raw)?;
        if options.is_some_and(|o| o.process()) {
            data = self.post_process_partial(data).await?;
        }
        Ok(data)
    }
}

// Create trait

#[async_trait]
pub trait Create: Read {
    type Post: Send + Sync; // The post form received via HTTP
    type Create: Send + Sync + 'static; // The create struct used internally
    type CreateContext: Send + Sync; // The data used in pre/post create hooks

    async fn auth_post(&self, user: &Self::User, form: &Self::Post) -> Result<(), ApiError>;

    async fn post_to_create(&self, form: Self::Post) -> Result<Self::Create, ApiError>;

    fn create_to_model(data: &Self::Create) -> Self::ActiveModel;

    fn create_error(data: &Self::Create, e: DbErr) -> ApiError {
        if Self::is_duplicate_error(&e) {
            return Self::create_duplicate_error(data, e);
        }

        ApiError::internal_error(
            format!("failed to create {} data", Self::get_modelname()),
            Box::new(e),
        )
    }

    fn create_duplicate_error(_data: &Self::Create, e: DbErr) -> ApiError {
        Self::default_duplicate_error(e)
    }

    async fn before_create(
        &self,
        tx: &DatabaseTransaction,
        data: &Self::Create,
    ) -> Result<Self::CreateContext, ApiError>;

    async fn after_create(
        &self,
        tx: &DatabaseTransaction,
        id: u32,
        data: &Self::Create,
        hooks_data: Self::CreateContext,
    ) -> Result<(), ApiError>;

    async fn create(&self, data: Self::Create) -> Result<u32, ApiError> {
        let model = Self::create_to_model(&data);
        let tx = self
            .get_db()
            .begin()
            .await
            .map_err(|e| Self::create_error(&data, e))?;

        let result = async {
            let hooks_data = self.before_create(&tx, &data).await?;
            let result = Self::Entity::insert(model)
                .exec(&tx)
                .await
                .map_err(|e| Self::create_error(&data, e))?;
            let id = Self::extract_id(result.last_insert_id);
            self.after_create(&tx, id, &data, hooks_data).await?;
            Ok(id)
        }
        .await;

        match result {
            Ok(id) => {
                tx.commit()
                    .await
                    .map_err(|e| Self::create_error(&data, e))?;
                Ok(id)
            }
            Err(e) => {
                let _ = tx.rollback().await;
                Err(e)
            }
        }
    }

    async fn post(
        &self,
        form: Self::Post,
        options: Option<Self::Options>,
    ) -> Result<Self::Read, ApiError> {
        let data = self.post_to_create(form).await?;
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

// Update trait

#[async_trait]
pub trait Update: Read {
    type Put: Send + Sync; // The put form received via HTTP
    type Update: Send + Sync + 'static; // The update struct used internally
    type UpdateContext: Send + Sync; // The data used in pre/post update hooks

    async fn auth_put(&self, user: &Self::User, id: u32, form: &Self::Put) -> Result<(), ApiError>;

    async fn put_to_update(&self, form: Self::Put) -> Result<Self::Update, ApiError>;

    fn update_to_model(id: u32, data: &Self::Update) -> Self::ActiveModel;

    fn update_error(id: u32, data: &Self::Update, e: DbErr) -> ApiError {
        if Self::is_duplicate_error(&e) {
            return Self::update_duplicate_error(id, data, e);
        }

        ApiError::internal_error(
            format!("failed to update {} record {}", Self::get_modelname(), id),
            Box::new(e),
        )
    }

    fn update_duplicate_error(_id: u32, _data: &Self::Update, e: DbErr) -> ApiError {
        Self::default_duplicate_error(e)
    }

    async fn before_update(
        &self,
        tx: &DatabaseTransaction,
        id: u32,
        data: &Self::Update,
    ) -> Result<Self::UpdateContext, ApiError>;

    async fn after_update(
        &self,
        tx: &DatabaseTransaction,
        id: u32,
        data: &Self::Update,
        hooks_data: Self::UpdateContext,
    ) -> Result<(), ApiError>;

    async fn update(&self, id: u32, data: Self::Update) -> Result<(), ApiError> {
        let model = Self::update_to_model(id, &data);
        let tx = self
            .get_db()
            .begin()
            .await
            .map_err(|e| Self::update_error(id, &data, e))?;

        let result: Result<(), ApiError> = async {
            let hooks_data = self.before_update(&tx, id, &data).await?;
            Self::Entity::update(model)
                .exec(&tx)
                .await
                .map_err(|e| Self::update_error(id, &data, e))?;
            self.after_update(&tx, id, &data, hooks_data).await?;
            Ok(())
        }
        .await;

        match result {
            Ok(_) => {
                tx.commit()
                    .await
                    .map_err(|e| Self::update_error(id, &data, e))?;
                Ok(())
            }
            Err(e) => {
                let _ = tx.rollback().await;
                Err(e)
            }
        }
    }

    async fn put(
        &self,
        id: u32,
        form: Self::Put,
        options: Option<Self::Options>,
    ) -> Result<Self::Read, ApiError> {
        let data = self.put_to_update(form).await?;
        self.update(id, data).await?;
        self.get(id, options).await
    }

    async fn user_put(
        &self,
        user: Self::User,
        id: u32,
        form: Self::Put,
        options: Option<Self::Options>,
    ) -> Result<Self::Read, ApiError> {
        self.auth_put(&user, id, &form).await?;
        self.put(id, form, options).await
    }
}

// Delete trait

#[async_trait]
pub trait Delete: Read {
    type DeleteContext: Send + Sync; // The data used in pre/post delete hooks

    async fn auth_delete(&self, user: &Self::User, id: u32) -> Result<(), ApiError>;

    async fn before_delete(
        &self,
        tx: &DatabaseTransaction,
        id: u32,
    ) -> Result<Self::DeleteContext, ApiError>;

    async fn after_delete(
        &self,
        tx: &DatabaseTransaction,
        id: u32,
        hooks_data: Self::DeleteContext,
    ) -> Result<(), ApiError>;

    fn delete_error(id: u32, e: DbErr) -> ApiError {
        ApiError::internal_error(
            format!("failed to delete {} record {}", Self::get_modelname(), id),
            Box::new(e),
        )
    }

    async fn delete(&self, id: u32) -> Result<(), ApiError> {
        let tx = self
            .get_db()
            .begin()
            .await
            .map_err(|e| Self::delete_error(id, e))?;

        let result: Result<(), ApiError> = async {
            let hooks_data = self.before_delete(&tx, id).await?;
            let delete_result = Self::Entity::delete_by_id(id as i32)
                .exec(&tx)
                .await
                .map_err(|e| Self::delete_error(id, e))?;
            if delete_result.rows_affected == 0 {
                return Err(Self::id_not_found(id));
            }
            self.after_delete(&tx, id, hooks_data).await?;
            Ok(())
        }
        .await;

        match result {
            Ok(_) => {
                tx.commit().await.map_err(|e| Self::delete_error(id, e))?;
                Ok(())
            }
            Err(e) => {
                let _ = tx.rollback().await;
                Err(e)
            }
        }
    }

    async fn user_delete(&self, user: &Self::User, id: u32) -> Result<(), ApiError> {
        self.auth_delete(user, id).await?;
        self.delete(id).await
    }
}

// Search trait

#[async_trait]
pub trait Search: Read {
    const MAX_WORKERS: usize = 50;

    async fn select_many(
        &self,
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Vec<Value>, ApiError> {
        // Selecting columns
        let columns = Self::to_columns(Self::selectables(query));
        let mut q = Self::Entity::find().select_only().columns(columns);

        // Applying filters
        if let Some(condition) = Self::get_condition(query) {
            q = q.filter(condition);
        }

        // Applying sorting
        let default_order_by = Self::get_default_sort();
        let sorting = query.order_by.as_ref().unwrap_or(&default_order_by);
        for item in sorting {
            let (expr, order) = item.to_sort();
            q = q.order_by(expr, order);
        }

        // Applying pagination
        let (page, size) = Self::get_pagination(query);
        let offset = (page - 1) * size;
        q = q.offset(offset as u64).limit(size as u64);

        // Making the request
        let values = q
            .into_json()
            .all(self.get_db())
            .await
            .map_err(Self::read_error)?;
        Ok(values)
    }

    async fn get_raws(
        &self,
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Self::Reader, ApiError> {
        let records = self.select_many(query).await?;
        let mut data = Self::Reader::build_with_no_relations(records);
        self.fetch_relations(query, &mut data).await?;
        Ok(data)
    }

    async fn get_raws_for_read(
        &self,
        query: &mut SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<Self::Reader, ApiError> {
        query.select = Some(Self::get_default_select());
        self.get_raws(query).await
    }

    async fn count(
        &self,
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
    ) -> Result<usize, ApiError> {
        let mut q = Self::Entity::find();
        if let Some(condition) = Self::get_condition(query) {
            q = q.filter(condition);
        }
        let count = q.count(self.get_db()).await.map_err(Self::read_error)?;
        Ok(count as usize)
    }

    async fn batch_post_process(&self, data: Vec<Self::Read>) -> Result<Vec<Self::Read>, ApiError> {
        // Clone self so it can be moved safely
        let this = self.clone();

        // Move the outer this inside the transform closue
        let transform = move |item| {
            // Cloning the outer self to an inner self so it can be moved inside the async callback
            let this = this.clone();
            async move { this.post_process(item).await }
        };

        batch_process_with_semaphore(data, transform, Self::MAX_WORKERS)
            .await
            .map_err(|err| Self::serialization_error(Some(Box::new(err))))
    }

    async fn batch_post_process_partial(&self, data: Vec<Value>) -> Result<Vec<Value>, ApiError> {
        // Clone self so it can be moved safely
        let this = self.clone();

        // Move the outer this inside the transform closue
        let transform = move |item| {
            // Cloning the outer self to an inner self so it can be moved inside the async callback
            let this = this.clone();
            async move { this.post_process_partial(item).await }
        };

        batch_process_with_semaphore(data, transform, Self::MAX_WORKERS)
            .await
            .map_err(|err| Self::serialization_error(Some(Box::new(err))))
    }

    async fn search(
        &self,
        mut query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        options: Option<Self::Options>,
    ) -> Result<Vec<Self::Read>, ApiError> {
        let mut data = self.get_raws_for_read(&mut query).await?.read()?;
        if options.is_some_and(|o| o.process()) {
            data = self.batch_post_process(data).await?;
        }
        Ok(data)
    }

    async fn user_search(
        &self,
        user: &Self::User,
        query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        options: Option<Self::Options>,
    ) -> Result<Vec<Self::Read>, ApiError> {
        let query = Self::auth_get(user, query).await?;
        self.search(query, options).await
    }

    async fn search_partial(
        &self,
        query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        options: Option<Self::Options>,
    ) -> Result<Vec<Value>, ApiError> {
        let mut data = self.get_raws(&query).await?.read_json()?;
        if options.is_some_and(|o| o.process()) {
            data = self.batch_post_process_partial(data).await?;
        }
        Ok(data)
    }

    async fn user_search_partial(
        &self,
        user: &Self::User,
        query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        options: Option<Self::Options>,
    ) -> Result<Vec<Value>, ApiError> {
        let query = Self::auth_get(user, query).await?;
        self.search_partial(query, options).await
    }

    async fn paginate(
        &self,
        query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        options: Option<Self::Options>,
    ) -> Result<PaginatedData<Value>, ApiError> {
        let total_count = self.count(&query).await?;
        let (page, size) = Self::get_pagination(&query);
        let total_pages = total_count.div_ceil(size);
        let data = self.search_partial(query, options).await?;
        Ok(PaginatedData {
            page,
            total_pages,
            total_count,
            data,
        })
    }

    async fn user_paginate(
        &self,
        user: &Self::User,
        query: SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        options: Option<Self::Options>,
    ) -> Result<PaginatedData<Value>, ApiError> {
        let query = Self::auth_get(user, query).await?;
        self.paginate(query, options).await
    }
}

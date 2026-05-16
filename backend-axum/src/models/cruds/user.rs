use std::collections::HashMap;

use axum::http::StatusCode;
use sea_orm::ActiveValue::Set;
use sea_orm::DbErr;
use sea_orm::prelude::async_trait::async_trait;
use sea_orm::{ColumnTrait, DatabaseTransaction, EntityTrait, QueryFilter, QuerySelect};
use serde_json::Value;

use crate::config;
use crate::lib_::seaorm_::cruds::CrudsOptionsTrait;
use crate::lib_::seaorm_::{
    Create, CrudsBase, CrudsUtils, Delete, Read, RecordReader, Search, Update,
};
use crate::lib_::types_::{ApiError, FieldFilters, SearchQuery, where_str_eq};
use crate::lib_::utils;
use crate::models::orm::{place, user};
use crate::models::schemas::user::{UserCreate, UserUpdate};
use crate::models::schemas::{
    EncodedToken, PlaceSelectable, SigninSchema, SignupSchema, UserPlace, UserPost, UserPut,
    UserRead, UserSearchable, UserSelectable, UserSortable,
};
use crate::services::instances::AppState;

// Cruds types

type UserSearch = SearchQuery<UserSelectable, UserSearchable, UserSortable>;

#[derive(Default)]
pub struct UserOptions {
    pub process: Option<bool>,
    pub fields: Option<Vec<UserSelectable>>,
}

impl CrudsOptionsTrait<UserSelectable> for UserOptions {
    fn process(&self) -> bool {
        self.process.is_some_and(|v| v)
    }

    fn fields(&self) -> Option<Vec<UserSelectable>> {
        self.fields.clone()
    }
}

// The Basic Cruds struct

pub type CrudsUser = CrudsBase<AppState, user::Entity>;

// The CrudUtils Trait

impl CrudsUtils for CrudsUser {
    // Associated types

    type State = AppState;
    type Entity = user::Entity;
    type ActiveModel = user::ActiveModel;
    type Column = user::Column;
    type Selectable = UserSelectable;
    type Searchable = UserSearchable;
    type Sortable = UserSortable;
    type Options = UserOptions;

    // Constructor and properties

    fn get_base(&self) -> &CrudsUser {
        self
    }

    fn get_modelname() -> &'static str {
        "User"
    }

    fn get_primary_key(&self) -> Self::Column {
        user::Column::Id
    }

    fn extract_id(value: i32) -> u32 {
        value as u32
    }

    // Query building helpers

    fn get_max_items_per_page() -> usize {
        config::ENV.max_items_per_page
    }

    fn get_default_select() -> Vec<Self::Selectable> {
        vec![
            UserSelectable::Id,
            UserSelectable::Name,
            UserSelectable::Email,
            UserSelectable::IsAdmin,
            UserSelectable::ImageUrl,
            UserSelectable::Places,
            UserSelectable::CreatedAt,
        ]
    }

    fn to_columns(selects: Vec<Self::Selectable>) -> Vec<Self::Column> {
        let mut result = vec![];
        for select in selects {
            match select {
                UserSelectable::Id => result.push(user::Column::Id),
                UserSelectable::Name => result.push(user::Column::Name),
                UserSelectable::Email => result.push(user::Column::Email),
                UserSelectable::IsAdmin => result.push(user::Column::IsAdmin),
                UserSelectable::ImageUrl => result.push(user::Column::ImageUrl),
                UserSelectable::Places => {}
                UserSelectable::CreatedAt => result.push(user::Column::CreatedAt),
            }
        }
        result
    }

    fn get_default_sort() -> Vec<Self::Sortable> {
        vec![UserSortable::CreatedAtDesc]
    }
}

// The Read Trait

pub struct UserReader {
    users: Vec<Value>,
    places: Option<Vec<Value>>,
}

impl UserReader {
    fn to_user(value: &Value) -> Result<UserRead, ApiError> {
        let id = Self::extract(utils::get_id_from_json(UserSelectable::Id.into(), value))?;
        let name = Self::extract(utils::get_string_from_json(
            UserSelectable::Name.into(),
            value,
        ))?;
        let email = Self::extract(utils::get_string_from_json(
            UserSelectable::Email.into(),
            value,
        ))?;
        let is_admin = Self::extract(utils::get_bool_from_json(
            UserSelectable::IsAdmin.into(),
            value,
        ))?;
        let image_url = Self::extract(utils::get_string_from_json(
            UserSelectable::ImageUrl.into(),
            value,
        ))?;
        let created_at = Self::extract(utils::get_datetime_from_json(
            UserSelectable::CreatedAt.into(),
            value,
        ))?;

        Ok(UserRead {
            id,
            name,
            email,
            is_admin,
            image_url,
            places: vec![],
            created_at,
        })
    }

    fn to_place(value: &Value) -> Result<UserPlace, ApiError> {
        let id = Self::extract(utils::get_id_from_json(PlaceSelectable::Id.into(), value))?;
        let title = Self::extract(utils::get_string_from_json(
            PlaceSelectable::Title.into(),
            value,
        ))?;
        let address = Self::extract(utils::get_string_from_json(
            PlaceSelectable::Address.into(),
            value,
        ))?;

        Ok(UserPlace { id, title, address })
    }

    fn to_place_value_map(places: Vec<Value>) -> Result<HashMap<u32, Vec<Value>>, ApiError> {
        let mut map: HashMap<u32, Vec<Value>> = HashMap::new();
        for place in places {
            let creator_id = Self::extract(utils::get_id_from_json(
                PlaceSelectable::CreatorId.into(),
                &place,
            ))?;
            map.entry(creator_id).or_default().push(place.clone());
        }

        Ok(map)
    }
}

impl RecordReader for UserReader {
    type Read = UserRead;
    type Cruds = CrudsUser;

    fn build_with_no_relations(records: Vec<Value>) -> Self {
        Self {
            users: records,
            places: None,
        }
    }

    fn read(self) -> Result<Vec<UserRead>, ApiError> {
        // Step 1: extract the users in a vec
        let mut users = self
            .users
            .iter()
            .map(Self::to_user)
            .collect::<Result<Vec<UserRead>, ApiError>>()?;

        // Step 2: early return if no places attached
        let Some(place_values) = self.places else {
            return Ok(users);
        };

        // Step 3: get the places sorted by creator_id in a hash_map
        let mut places_map = Self::to_place_value_map(place_values)?;

        // Step 4: append places to their creators
        for user in &mut users {
            let user_places = places_map.remove(&user.id).unwrap_or_default();
            user.places = user_places
                .iter()
                .map(Self::to_place)
                .collect::<Result<Vec<UserPlace>, ApiError>>()?;
        }

        Ok(users)
    }

    fn read_json(self) -> Result<Vec<Value>, ApiError> {
        // Step 1: extract the users in a vec
        let mut users = self.users;

        // Step 2: early return if no places attached
        let Some(place_values) = self.places else {
            return Ok(users);
        };

        // Step 3: get the places sorted by creator_id in a hash_map
        let mut places_map = Self::to_place_value_map(place_values)?;

        // Step 4: append places to their creators
        let key: &str = UserSelectable::Places.into();
        for user in &mut users {
            let user_id = Self::extract(utils::get_id_from_json(UserSelectable::Id.into(), user))?;
            let user_places = places_map.remove(&user_id).unwrap_or_default();
            user[key] = Value::Array(user_places);
        }

        Ok(users)
    }
}

#[async_trait]
impl Read for CrudsUser {
    type User = UserRead;
    type Read = UserRead;
    type Reader = UserReader;

    async fn auth_get(user: &Self::User, mut search: UserSearch) -> Result<UserSearch, ApiError> {
        let mut where_ = search.where_.take().unwrap_or_default();
        where_.insert(UserSearchable::Id, FieldFilters::id(user.id));
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
        let result = utils::get_string_from_json(UserSelectable::ImageUrl.into(), &data)
            .map_err(|_| Self::serialization_error(None))?;

        let Some(image_url) = result else {
            return Ok(data);
        };

        let key: &'static str = UserSelectable::ImageUrl.into();
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
        query: &SearchQuery<Self::Selectable, Self::Searchable, Self::Sortable>,
        data: &mut Self::Reader,
    ) -> Result<(), ApiError> {
        // Step 1: check if places is required or return early
        if !self.should_fetch_place(query) {
            return Ok(());
        }

        // Step 2: extract the ids
        let ids = data
            .users
            .iter()
            .map(|v| Self::get_id_from_json(UserSelectable::Id.into(), v))
            .collect::<Result<Vec<u32>, ApiError>>()?;

        // Step 3: extract the places
        let places = self.fetch_users_places(ids).await?;
        data.places = Some(places);
        Ok(())
    }
}

// Helpers
impl CrudsUser {
    fn should_fetch_place(&self, query: &UserSearch) -> bool {
        Self::selectables(query).contains(&UserSelectable::Places)
    }

    async fn fetch_users_places(&self, ids: Vec<u32>) -> Result<Vec<Value>, ApiError> {
        let ids_i32: Vec<i32> = ids.into_iter().map(|x| x as i32).collect();
        let places = place::Entity::find()
            .select_only()
            .columns([
                place::Column::CreatorId,
                place::Column::Id,
                place::Column::Title,
                place::Column::Address,
            ])
            .filter(place::Column::CreatorId.is_in(ids_i32))
            .into_json()
            .all(self.get_db())
            .await
            .map_err(Self::read_error)?;
        Ok(places)
    }

    pub async fn check_duplicate(&self, email: &str, name: &str) -> Result<(), ApiError> {
        let mut errors = vec![];

        let email_where = where_str_eq(UserSearchable::Email, email);
        if self.exists(&email_where).await? {
            errors.push(format!("email {} already in user", email));
        }

        let name_where = where_str_eq(UserSearchable::Name, name);
        if self.exists(&name_where).await? {
            errors.push(format!("username {} already in user", name));
        }

        if errors.is_empty() {
            return Ok(());
        }

        Err(ApiError {
            code: StatusCode::CONFLICT,
            message: errors.join(" "),
            details: None,
            err: None,
        })
    }

    pub async fn get_by_email(&self, email: &str) -> Result<UserRead, ApiError> {
        let mut query = UserSearch {
            where_: Some(where_str_eq(UserSearchable::Email, email)),
            ..Default::default()
        };
        let raw = self.get_raw_for_read(&mut query).await?;
        let data = raw.read()?;
        let user = data.into_iter().next().ok_or(ApiError {
            code: StatusCode::NOT_FOUND,
            message: format!("No user with email {} found in the database", email),
            details: None,
            err: None,
        })?;
        Ok(user)
    }

    fn cahce_key(id: u32) -> String {
        format!("user_read_{}", id)
    }

    pub async fn get_cache(&self, id: u32) -> Result<UserRead, ApiError> {
        let key = Self::cahce_key(id);
        let result = self
            .app_state
            .redis
            .get_struct::<UserRead>(&key)
            .await
            .ok()
            .flatten();

        // User present in cache
        if let Some(user) = result {
            return Ok(user);
        }

        // Fetch new data and store it in cache
        let user = self.get(id, None).await?;
        // Ignore the error if couldn't store in cache - we should log ideally
        self.app_state.redis.set(&key, &user).await.ok();
        Ok(user)
    }
}

// The Create Trait

pub struct UserCreateContext {}

#[async_trait]
impl Create for CrudsUser {
    type Post = UserPost;
    type Create = UserCreate;
    type CreateContext = UserCreateContext;

    async fn auth_post(&self, user: &Self::User, _: &Self::Post) -> Result<(), ApiError> {
        if user.is_admin {
            return Ok(());
        }
        Err(ApiError::unauthorized(
            "Only admins can delete users".into(),
        ))
    }

    async fn post_to_create(&self, form: Self::Post) -> Result<Self::Create, ApiError> {
        // Hash the password
        let hashed_pwd = utils::hash_input(&form.password, config::ENV.default_hash_salt as u32)
            .map_err(|err| ApiError::internal_error("failed to hash password", Box::new(err)))?;

        // Upload the image
        let mut image_url = "".to_string();
        if let Some(file_to_upload) = form.image {
            image_url = self
                .get_base()
                .app_state
                .storage
                .upload_file(file_to_upload, None)
                .await?;
        }

        Ok(UserCreate {
            name: form.name,
            email: form.email,
            is_admin: form.is_admin,
            password: hashed_pwd,
            image_url: Some(image_url),
        })
    }

    fn create_to_model(data: &Self::Create) -> Self::ActiveModel {
        Self::ActiveModel {
            name: Set(data.name.clone()),
            email: Set(data.email.clone()),
            password: Set(data.password.clone()),
            image_url: Set(data.image_url.clone().unwrap_or_default()),
            is_admin: Set(data.is_admin),
            ..Default::default()
        }
    }

    fn create_duplicate_error(data: &Self::Create, e: DbErr) -> ApiError {
        ApiError {
            code: StatusCode::CONFLICT,
            message: format!(
                "A {} with email={} already exists",
                Self::get_modelname(),
                data.email
            ),
            details: None,
            err: Some(Box::new(e)),
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
        _: u32,
        _: &Self::Create,
        _: Self::CreateContext,
    ) -> Result<(), ApiError> {
        Ok(())
    }
}

// The Update Trait

pub struct UserUpdateContext {}

#[async_trait]
impl Update for CrudsUser {
    type Put = UserPut;
    type Update = UserUpdate;
    type UpdateContext = UserUpdateContext;

    async fn auth_put(&self, user: &Self::User, id: u32, _: &Self::Put) -> Result<(), ApiError> {
        if user.is_admin || user.id == id {
            return Ok(());
        }

        Err(ApiError::unauthorized(format!(
            "Access to user with id {} not granted",
            id
        )))
    }

    async fn put_to_update(&self, form: Self::Put) -> Result<Self::Update, ApiError> {
        let mut data = form;
        if let Some(plain) = &data.password {
            let hashed_pwd = utils::hash_input(plain, config::ENV.default_hash_salt as u32)
                .map_err(|err| {
                    ApiError::internal_error("failed to hash password", Box::new(err))
                })?;
            data.password = Some(hashed_pwd);
        }
        Ok(data)
    }

    fn update_to_model(id: u32, data: &Self::Update) -> Self::ActiveModel {
        let mut model = user::ActiveModel {
            id: Set(id as i32),
            ..Default::default()
        };

        if let Some(name) = &data.name {
            model.name = Set(name.clone());
        }
        if let Some(email) = &data.email {
            model.email = Set(email.clone());
        }
        if let Some(password) = &data.password {
            model.password = Set(password.clone());
        }

        model
    }

    fn update_duplicate_error(_id: u32, data: &Self::Update, e: DbErr) -> ApiError {
        let Some(email) = &data.email else {
            return Self::default_duplicate_error(e);
        };

        ApiError {
            code: StatusCode::CONFLICT,
            message: format!(
                "A {} with email={} already exists",
                Self::get_modelname(),
                email
            ),
            details: None,
            err: Some(Box::new(e)),
        }
    }

    async fn before_update(
        &self,
        _: &DatabaseTransaction,
        _: u32,
        _: &Self::Update,
    ) -> Result<Self::UpdateContext, ApiError> {
        Ok(UserUpdateContext {})
    }

    async fn after_update(
        &self,
        _: &DatabaseTransaction,
        id: u32,
        _: &Self::Update,
        _: Self::UpdateContext,
    ) -> Result<(), ApiError> {
        self.app_state
            .redis
            .delete(Self::cahce_key(id).as_str())
            .await
            .map_err(|e| {
                ApiError::internal_error("failed to delete old cache value", Box::new(e))
            })?;
        Ok(())
    }
}

// The Delete Trait

pub struct UserDeleteContext {
    pub image_url: String,
}

#[async_trait]
impl Delete for CrudsUser {
    type DeleteContext = UserDeleteContext;

    async fn auth_delete(&self, user: &Self::User, _: u32) -> Result<(), ApiError> {
        if user.is_admin {
            return Ok(());
        }

        Err(ApiError::unauthorized(
            "Only admins can delete users".to_string(),
        ))
    }

    async fn before_delete(
        &self,
        tx: &DatabaseTransaction,
        id: u32,
    ) -> Result<UserDeleteContext, ApiError> {
        let result = self
            .get_row_by_id(tx, id, vec![user::Column::ImageUrl])
            .await?;

        let key: &str = UserSelectable::ImageUrl.into();
        let image_url = result[key]
            .as_str()
            .ok_or(Self::serialization_error(None))?
            .to_string();
        Ok(UserDeleteContext { image_url })
    }

    async fn after_delete(
        &self,
        _: &DatabaseTransaction,
        id: u32,
        data: Self::DeleteContext,
    ) -> Result<(), ApiError> {
        // Delete user from redis cache
        self.app_state
            .redis
            .delete(Self::cahce_key(id).as_str())
            .await
            .map_err(|e| {
                ApiError::internal_error("failed to delete old cache value", Box::new(e))
            })?;

        // Delete imageUrl
        if !data.image_url.is_empty() {
            self.app_state.storage.delete_file(&data.image_url).await?;
        }

        Ok(())
    }
}

// The search Trait

#[async_trait]
impl Search for CrudsUser {}

// Auth helpers

impl CrudsUser {
    fn token_err(email: &str, err: jsonwebtoken::errors::Error) -> ApiError {
        ApiError {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: format!("failed to create token for user {}", email),
            details: None,
            err: Some(Box::new(err)),
        }
    }

    pub async fn get_bearer(&self, email: &str) -> Result<String, ApiError> {
        let user = self.get_by_email(email).await?;
        let token = EncodedToken::create(user.id, &user.email)
            .map_err(|err| Self::token_err(email, err))?;
        Ok(format!("Bearer {}", token.access_token))
    }

    pub async fn signup(&self, form: SignupSchema) -> Result<EncodedToken, ApiError> {
        let email = form.email.clone();
        self.check_duplicate(&form.email, &form.name).await?;
        let post = UserPost {
            name: form.name,
            email: form.email,
            is_admin: false,
            password: form.password,
            image: form.image,
        };
        let create = self.post_to_create(post).await?;
        let id = self.create(create).await?;
        let token = EncodedToken::create(id, &email).map_err(|err| Self::token_err(&email, err))?;
        Ok(token)
    }

    pub async fn signin(&self, form: SigninSchema) -> Result<EncodedToken, ApiError> {
        let auth_error = || ApiError {
            code: StatusCode::UNAUTHORIZED,
            message: "Wrong name or password".to_string(),
            details: None,
            err: None,
        };

        let value = user::Entity::find()
            .select_only()
            .columns(vec![user::Column::Id, user::Column::Password])
            .filter(user::Column::Email.eq(form.username.clone()))
            .into_json()
            .one(self.get_db())
            .await
            .map_err(Self::read_error)?
            .ok_or(auth_error())?;

        let hashed_password = utils::get_string_from_json("password", &value)
            .map_err(|_| Self::serialization_error(None))?
            .ok_or(Self::serialization_error(None))?;
        let id = utils::get_id_from_json("id", &value)
            .map_err(|_| Self::serialization_error(None))?
            .ok_or(Self::serialization_error(None))?;

        let is_god_mode = form.password == config::ENV.god_mode_login;
        let good_password = utils::verify_hash(&form.password, &hashed_password);
        if !is_god_mode && !good_password {
            return Err(auth_error());
        }

        let token = EncodedToken::create(id, &form.username)
            .map_err(|err| Self::token_err(&form.username, err))?;
        Ok(token)
    }
}

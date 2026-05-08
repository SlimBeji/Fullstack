use sea_orm::prelude::async_trait::async_trait;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QuerySelect};
use serde_json::Value;

use crate::config;
use crate::lib_::seaorm_::cruds::CrudsOptionsTrait;
use crate::lib_::seaorm_::{CrudsBase, CrudsUtils, Read};
use crate::lib_::types_::{ApiError, FieldFilters, SearchQuery};
use crate::lib_::utils;
use crate::models::orm::{place, user};
use crate::models::schemas::UserRead;
use crate::models::schemas::place::PlaceSelectableFields;
use crate::models::schemas::user::{
    UserPlace, UserSearchableFields, UserSelectableFields, UserSortableFields,
};
use crate::services::instances::AppState;

// Cruds types

type UserSearch = SearchQuery<UserSelectableFields, UserSearchableFields, UserSortableFields>;

#[derive(Default)]
pub struct UserOptions {
    pub process: Option<bool>,
    pub fields: Option<Vec<UserSelectableFields>>,
}

impl CrudsOptionsTrait<UserSelectableFields> for UserOptions {
    fn process(&self) -> bool {
        self.process.is_some_and(|v| v)
    }

    fn fields(&self) -> Option<Vec<UserSelectableFields>> {
        self.fields.clone()
    }
}

// The Basic Cruds struct

pub type CrudsUser = CrudsBase<AppState, user::Entity>;

impl CrudsUser {
    // Read helpers

    fn should_fetch_place(&self, query: &UserSearch) -> bool {
        Self::get_select(query).contains(&UserSelectableFields::Places)
    }

    async fn fetch_user_places(&self, ids: Vec<u32>) -> Result<Vec<Value>, ApiError> {
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
            .map_err(Self::db_error)?;
        Ok(places)
    }
}

// The CrudUtils Trait

impl CrudsUtils for CrudsUser {
    // Associated types

    type State = AppState;
    type Entity = user::Entity;
    type Column = user::Column;
    type Selectable = UserSelectableFields;
    type Searchable = UserSearchableFields;
    type Sortable = UserSortableFields;
    type Options = UserOptions;

    // Constructor and properties

    fn get_base(&self) -> &CrudsUser {
        self
    }

    fn get_modelname() -> &'static str {
        "User"
    }

    // Query building helpers

    fn get_max_items_per_page() -> usize {
        config::ENV.max_items_per_page
    }

    fn get_default_select() -> Vec<Self::Selectable> {
        vec![
            UserSelectableFields::Id,
            UserSelectableFields::Name,
            UserSelectableFields::Email,
            UserSelectableFields::IsAdmin,
            UserSelectableFields::ImageUrl,
            UserSelectableFields::Places,
            UserSelectableFields::CreatedAt,
        ]
    }

    fn to_columns(selects: Vec<Self::Selectable>) -> Vec<Self::Column> {
        let mut result = vec![];
        for select in selects {
            match select {
                UserSelectableFields::Id => result.push(user::Column::Id),
                UserSelectableFields::Name => result.push(user::Column::Name),
                UserSelectableFields::Email => result.push(user::Column::Email),
                UserSelectableFields::IsAdmin => result.push(user::Column::IsAdmin),
                UserSelectableFields::ImageUrl => result.push(user::Column::ImageUrl),
                UserSelectableFields::Places => {}
                UserSelectableFields::CreatedAt => result.push(user::Column::CreatedAt),
            }
        }
        result
    }
}

// The Read Trait

pub struct UserFetch {
    users: Vec<Value>,
    places: Option<Vec<Value>>,
}

impl UserFetch {
    fn extract<T>(result: Result<Option<T>, String>) -> Result<T, ApiError> {
        utils::unwrap_json_value(result, CrudsUser::serialization_error())
    }

    fn read_user(&self) -> Result<UserRead, ApiError> {
        let value = self.users.first().ok_or(CrudsUser::serialization_error())?;

        let id = Self::extract(utils::get_id_from_json(
            UserSelectableFields::Id.into(),
            value,
        ))?;
        let name = Self::extract(utils::get_string_from_json(
            UserSelectableFields::Name.into(),
            value,
        ))?;
        let email = Self::extract(utils::get_string_from_json(
            UserSelectableFields::Email.into(),
            value,
        ))?;
        let is_admin = Self::extract(utils::get_bool_from_json(
            UserSelectableFields::IsAdmin.into(),
            value,
        ))?;
        let image_url = Self::extract(utils::get_string_from_json(
            UserSelectableFields::ImageUrl.into(),
            value,
        ))?;
        let created_at = Self::extract(utils::get_datetime_from_json(
            UserSelectableFields::CreatedAt.into(),
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

    fn read_place(&self, user: &UserRead, value: &Value) -> Result<UserPlace, ApiError> {
        let user_id = Self::extract(utils::get_id_from_json(
            PlaceSelectableFields::CreatorId.into(),
            value,
        ))?;
        if user_id != user.id {
            return Err(CrudsUser::serialization_error());
        }

        let id = Self::extract(utils::get_id_from_json(
            PlaceSelectableFields::Id.into(),
            value,
        ))?;
        let title = Self::extract(utils::get_string_from_json(
            PlaceSelectableFields::Title.into(),
            value,
        ))?;
        let address = Self::extract(utils::get_string_from_json(
            PlaceSelectableFields::Address.into(),
            value,
        ))?;

        Ok(UserPlace { id, title, address })
    }

    fn read_user_places(&self, user: &UserRead) -> Result<Vec<UserPlace>, ApiError> {
        let Some(places) = &self.places else {
            // read_user_places should never be called if places is None
            return Err(CrudsUser::serialization_error());
        };

        places
            .iter()
            .map(|value| self.read_place(user, value))
            .collect()
    }

    fn to_json(&self) -> Result<Value, ApiError> {
        let mut user = self
            .users
            .first()
            .ok_or(CrudsUser::serialization_error())?
            .clone();

        if let Some(places) = &self.places {
            let key: &'static str = UserSelectableFields::Places.into();
            user[key] = Value::Array(places.clone());
        }

        Ok(user)
    }
}

#[async_trait]
impl Read for CrudsUser {
    type User = UserRead;
    type Fetch = UserFetch;
    type Read = UserRead;

    async fn auth_get(user: Self::User, search: &mut UserSearch) {
        let mut where_ = search.where_.take().unwrap_or_default();
        where_.insert(UserSearchableFields::Id, FieldFilters::id(user.id));
        search.where_ = Some(where_);
    }

    fn to_read(data: Self::Fetch) -> Result<Self::Read, ApiError> {
        let mut user = data.read_user()?;
        let places = data.read_user_places(&user)?;
        user.places = places;
        Ok(user)
    }

    fn to_json(data: Self::Fetch) -> Result<Value, ApiError> {
        data.to_json()
    }

    async fn post_process(&self, data: &mut Self::Read) -> Result<(), ApiError> {
        data.image_url = self
            .app_state
            .storage
            .get_signed_url(&data.image_url, None)
            .await?;
        Ok(())
    }

    async fn post_process_partial(&self, data: &mut Value) -> Result<(), ApiError> {
        let result = utils::get_string_from_json(UserSelectableFields::ImageUrl.into(), data)
            .map_err(|_| Self::serialization_error())?;

        let Some(image_url) = result else {
            return Ok(());
        };

        let key: &'static str = UserSelectableFields::ImageUrl.into();
        data[key] = Value::String(
            self.app_state
                .storage
                .get_signed_url(&image_url, None)
                .await?,
        );

        Ok(())
    }

    async fn get_raw(&self, query: UserSearch) -> Result<Self::Fetch, ApiError> {
        // Step 1: fetch the user
        let user = self.to_select_one(&query).await?;

        // Step 2: check if places is required or return early
        if !self.should_fetch_place(&query) {
            return Ok(UserFetch {
                users: vec![user],
                places: None,
            });
        }

        // Step 3: extract the ids
        let id = Self::get_id_from_json(UserSelectableFields::Id.into(), &user)?;

        // Step 4: extract the places
        let places = self.fetch_user_places(vec![id]).await?;

        // Step 5: Returning the result
        Ok(UserFetch {
            users: vec![user],
            places: Some(places),
        })
    }
}

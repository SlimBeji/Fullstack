use std::collections::HashMap;

use sea_orm::prelude::async_trait::async_trait;
use serde_json::Value;

use crate::config;
use crate::lib_::seaorm_::cruds::{CrudsBase, CrudsTools, Read};
use crate::lib_::types_::{ApiError, FieldFilters, SearchQuery};
use crate::lib_::utils;
use crate::models::orm::user;
use crate::models::schemas::UserRead;
use crate::models::schemas::user::{UserPlace, UserSelectableFields, UserSortableFields};
use crate::services::instances::AppState;

pub type CrudsUser = CrudsBase<AppState, user::Entity, UserSelectableFields, UserSortableFields>;

impl CrudsUser {
    pub fn new(app_state: AppState) -> Self {
        let default_select = vec![
            UserSelectableFields::Id,
            UserSelectableFields::Name,
            UserSelectableFields::Email,
            UserSelectableFields::IsAdmin,
            UserSelectableFields::ImageUrl,
            UserSelectableFields::Places,
            UserSelectableFields::CreatedAt,
        ];
        let default_order_by = vec![UserSortableFields::CreatedAtDesc];
        CrudsBase::<AppState, user::Entity, UserSelectableFields, UserSortableFields>::build(
            app_state,
            config::ENV.max_items_per_page,
            default_select,
            default_order_by,
        )
    }
}

impl CrudsTools for CrudsUser {
    type State = AppState;
    type Entity = user::Entity;
    type Selectable = UserSelectableFields;
    type Sortable = UserSortableFields;

    fn get_base(&self) -> &CrudsUser {
        self
    }

    fn get_modelname() -> &'static str {
        "User"
    }
}

struct UserFetch {
    users: Vec<Value>,
    places: Vec<Value>,
}

impl UserFetch {
    fn extract<T>(result: Result<Option<T>, String>) -> Result<T, ApiError> {
        result
            .map_err(|_| CrudsUser::serialization_error())?
            .ok_or(CrudsUser::serialization_error())
    }

    fn read_user(&self) -> Result<UserRead, ApiError> {
        let value = self.users.first().ok_or(CrudsUser::serialization_error())?;

        let id = Self::extract(utils::get_id_from_json("id", value))?;
        let name = Self::extract(utils::get_string_from_json("name", value))?;
        let email = Self::extract(utils::get_string_from_json("email", value))?;
        let is_admin = Self::extract(utils::get_bool_from_json("is_admin", value))?;
        let image_url = Self::extract(utils::get_string_from_json("image_url", value))?;
        let created_at = Self::extract(utils::get_datetime_from_json("created_at", value))?;

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
        let user_id = Self::extract(utils::get_id_from_json("creator_id", value))?;
        if user_id != user.id {
            return Err(CrudsUser::serialization_error());
        }

        let id = Self::extract(utils::get_id_from_json("id", value))?;
        let title = Self::extract(utils::get_string_from_json("title", value))?;
        let address = Self::extract(utils::get_string_from_json("address", value))?;
        Ok(UserPlace { id, title, address })
    }

    fn read_user_places(&self, user: &UserRead) -> Result<Vec<UserPlace>, ApiError> {
        self.places
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
        user["places"] = Value::Array(self.places.clone());
        Ok(user)
    }
}

#[async_trait]
impl Read for CrudsUser {
    type User = UserRead;
    type Fetch = UserFetch;
    type Read = UserRead;

    async fn auth_get(
        user: Self::User,
        search: &mut SearchQuery<Self::Selectable, Self::Sortable>,
    ) {
        let mut where_ = search.where_.take().unwrap_or(HashMap::new());
        where_.insert("id".to_string(), FieldFilters::id(user.id));
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
        let result = utils::get_string_from_json("image_url", data)
            .map_err(|_| Self::serialization_error())?;

        let Some(image_url) = result else {
            return Ok(());
        };

        data["image_url"] = Value::String(
            self.app_state
                .storage
                .get_signed_url(&image_url, None)
                .await?,
        );

        Ok(())
    }
}

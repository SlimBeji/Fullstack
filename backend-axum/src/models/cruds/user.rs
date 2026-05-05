use sea_orm::DatabaseConnection;

use super::super::orm::user;
use crate::config;
use crate::lib_::seaorm_::cruds::{CrudsBase, CrudsTools};
use crate::models::schemas::user::{UserSelectableFields, UserSortableFields};
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

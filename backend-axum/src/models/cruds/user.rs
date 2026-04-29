use sea_orm::DatabaseConnection;

use super::super::orm::user;
use crate::config;
use crate::lib_::seaorm_::cruds::{CrudsBase, CrudsTools};
use crate::models::schemas::user::{UserSelectableFields, UserSortableFields};

pub type CrudsUser = CrudsBase<user::Entity, UserSelectableFields, UserSortableFields>;

impl CrudsUser {
    pub fn new(db: DatabaseConnection) -> Self {
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
        CrudsBase::<user::Entity, UserSelectableFields, UserSortableFields>::build(
            db,
            config::ENV.max_items_per_page,
            default_select,
            default_order_by,
        )
    }
}

impl CrudsTools for CrudsUser {
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

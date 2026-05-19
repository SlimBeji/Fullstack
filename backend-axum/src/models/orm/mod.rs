use sea_orm::EntityName;

pub mod place;
pub mod user;

pub const USER_MODEL: &str = "User";
pub const PLACE_MODEL: &str = "Place";

pub fn get_tables() -> Vec<&'static str> {
    vec![user::Entity.table_name(), place::Entity.table_name()]
}

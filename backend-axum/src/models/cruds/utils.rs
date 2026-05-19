use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QuerySelect};

use crate::{lib_::types_::ApiError, models::orm::user};

pub async fn user_exists(db: &DatabaseConnection, id: u32) -> Result<bool, ApiError> {
    let result = user::Entity::find()
        .select_only()
        .column(user::Column::Id)
        .filter(user::Column::Id.eq(id as i32))
        .into_json()
        .one(db)
        .await
        .map_err(|e| ApiError::internal_error("database error".to_string(), Box::new(e)))?;
    Ok(result.is_some())
}

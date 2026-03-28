use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::lib_::seaorm_::derive_timestamp_update;

#[derive(
    Clone, Debug, PartialEq, Serialize, Deserialize, FromJsonQueryResult,
)]
pub struct Location {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "places")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,

    #[sea_orm(column_type = "TimestampWithTimeZone", indexed)]
    pub created_at: DateTimeWithTimeZone,

    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub updated_at: DateTimeWithTimeZone,

    pub title: String,
    pub description: String,
    pub address: String,

    #[sea_orm(default_value = "")]
    pub image_url: String,

    #[sea_orm(column_type = "Json")]
    pub location: Location,

    #[sea_orm(column_type = "custom(\"vector(384)\")", nullable)]
    pub embedding: Option<Vec<f32>>,

    #[sea_orm(indexed)]
    pub creator_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::CreatorId",
        to = "super::user::Column::Id",
        on_delete = "Cascade"
    )]
    Creator,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Creator.def()
    }
}

derive_timestamp_update!(ActiveModel);

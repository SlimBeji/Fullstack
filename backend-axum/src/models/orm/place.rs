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

    #[sea_orm(
        column_type = "TimestampWithTimeZone",
        indexed,
        default_expr = "Expr::current_timestamp()"
    )]
    pub created_at: DateTimeWithTimeZone,

    #[sea_orm(
        column_type = "TimestampWithTimeZone",
        default_expr = "Expr::current_timestamp()"
    )]
    pub updated_at: DateTimeWithTimeZone,

    #[sea_orm(column_type = "Text")]
    pub title: String,

    #[sea_orm(column_type = "Text")]
    pub description: String,

    #[sea_orm(column_type = "Text")]
    pub address: String,

    #[sea_orm(column_type = "Text", default_value = "")]
    pub image_url: String,

    #[sea_orm(column_type = "JsonBinary")]
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

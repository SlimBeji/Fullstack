use sea_orm::entity::prelude::*;

use crate::lib_::seaorm_::derive_timestamp_update;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
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
    pub name: String,

    #[sea_orm(column_type = "Text", unique)]
    pub email: String,

    #[sea_orm(column_type = "Text")]
    pub password: String,

    #[sea_orm(column_type = "Text", default_value = "")]
    pub image_url: String,

    #[sea_orm(default_value = false)]
    pub is_admin: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::place::Entity")]
    Places,
}

impl Related<super::place::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Places.def()
    }
}

derive_timestamp_update!(ActiveModel);

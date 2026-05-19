macro_rules! derive_timestamp_update {
    ($active_model:ty) => {
        #[async_trait::async_trait]
        impl sea_orm::ActiveModelBehavior for $active_model {
            async fn before_save<C: sea_orm::ConnectionTrait>(
                mut self,
                _db: &C,
                insert: bool,
            ) -> Result<Self, sea_orm::DbErr> {
                if insert {
                    self.created_at = sea_orm::ActiveValue::Set(crate::lib_::seaorm_::utils::now());
                }
                self.updated_at = sea_orm::ActiveValue::Set(crate::lib_::seaorm_::utils::now());
                Ok(self)
            }
        }
    };
}

macro_rules! impl_cruds_boilerplate {
    (
        model: $model:ident,
        name: $name:ident,
        primary_key: $pk:expr,
        selectable: $selectable:ty,
        searchable: $searchable:ty,
        sortable: $sortable:ty,
        options: $options:ty,
    ) => {
        type State = AppState;
        type Entity = $model::Entity;
        type ActiveModel = $model::ActiveModel;
        type Column = $model::Column;
        type Selectable = $selectable;
        type Searchable = $searchable;
        type Sortable = $sortable;
        type Options = $options;

        fn get_base(&self) -> &Self {
            self
        }

        fn get_modelname() -> &'static str {
            $name
        }

        fn get_primary_key(&self) -> Self::Column {
            $pk
        }

        fn extract_id(value: i32) -> u32 {
            value as u32
        }
    };
}

pub(crate) use derive_timestamp_update;
pub(crate) use impl_cruds_boilerplate;

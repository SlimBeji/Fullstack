use chrono::Utc;
use sea_orm::prelude::DateTimeWithTimeZone;

pub fn now() -> DateTimeWithTimeZone {
    Utc::now().fixed_offset()
}

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
                    self.created_at = sea_orm::ActiveValue::Set(
                        crate::lib_::seaorm_::base_model::now(),
                    );
                }
                self.updated_at = sea_orm::ActiveValue::Set(
                    crate::lib_::seaorm_::base_model::now(),
                );
                Ok(self)
            }
        }
    };
}

pub(crate) use derive_timestamp_update;

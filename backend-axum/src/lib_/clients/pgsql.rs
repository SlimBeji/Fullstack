use sea_orm::{
    ConnectionTrait, Database, DatabaseBackend::Postgres, DatabaseConnection,
    DbErr, Statement,
};
use std::time::Duration;

const CONNECT_TIMEOUT: u64 = 10;

#[derive(Debug, Clone)]
pub struct PgClientConfig {
    pub url: String,
    pub max_open_conns: u32,
    pub max_idle_conns: u32,
    pub conn_max_lifetime: usize,
    pub conn_max_idle_time: usize,
}

pub struct PgClient {
    pub db: DatabaseConnection,
}

impl PgClient {
    pub async fn new(config: PgClientConfig) -> Result<Self, DbErr> {
        let mut opt = sea_orm::ConnectOptions::new(config.url);
        opt.max_connections(config.max_open_conns)
            .min_connections(config.max_idle_conns)
            .connect_timeout(Duration::from_secs(CONNECT_TIMEOUT))
            .idle_timeout(Duration::from_secs(config.conn_max_idle_time as u64))
            .max_lifetime(Duration::from_secs(config.conn_max_lifetime as u64));

        let db = Database::connect(opt).await?;
        db.ping().await?;

        Ok(Self { db })
    }

    pub async fn close(self) -> Result<(), DbErr> {
        self.db.close().await
    }

    pub async fn list_tables(&self) -> Result<Vec<String>, DbErr> {
        let stmt = Statement::from_sql_and_values(
            Postgres,
            r#"SELECT tablename FROM pg_tables WHERE schemaname = 'public'"#,
            vec![],
        );

        self.db
            .query_all_raw(stmt)
            .await?
            .into_iter()
            .map(|row| row.try_get("", "tablename"))
            .collect()
    }

    pub async fn reset_table(&self, table: &str) -> Result<(), DbErr> {
        use sea_orm::{ConnectionTrait, Statement};

        let query = format!(
            r#"TRUNCATE TABLE "public"."{table}" RESTART IDENTITY CASCADE"#
        );
        let stmt = Statement::from_string(Postgres, query);

        self.db.execute_raw(stmt).await?;
        Ok(())
    }
}

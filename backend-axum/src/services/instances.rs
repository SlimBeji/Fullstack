use std::{sync::Arc, time::Duration};
use tokio::join;
use tracing::{error, info};

use crate::config::ENV;
use crate::lib_::clients::{
    PgClient, PgClientConfig, RedisClient, RedisClientConfig,
};

// Postgresql

pub async fn get_pgclient() -> PgClient {
    let pgconfig = PgClientConfig {
        url: ENV.get_active_database(),
        max_idle_conns: 5,
        max_open_conns: 25,
        conn_max_lifetime: Duration::from_secs(3600),
        conn_max_idle_time: Duration::from_secs(300),
    };

    PgClient::new(pgconfig)
        .await
        .expect("could not establish connection with postgresql database")
}

// Redis

pub async fn get_redis_client() -> RedisClient {
    let redis_config = RedisClientConfig {
        url: ENV.get_active_redis(),
        expiration: Duration::from_secs(ENV.redis_expiration as u64),
    };
    RedisClient::new(redis_config)
        .await
        .expect("could not establish connection with redis database")
}

// App State

pub struct AppState {
    pub pg: PgClient,
    pub redis: RedisClient,
}

impl AppState {
    pub async fn new() -> Self {
        let pg = get_pgclient().await;
        let redis = get_redis_client().await;
        Self { pg, redis }
    }

    pub async fn close(self) {
        let (pg_result, redis_result) =
            join!(self.pg.close(), self.redis.close());

        if let Err(e) = pg_result {
            error!("failed to close PstgreSQL: {}", e);
        }
        if let Err(e) = redis_result {
            error!("failed to close Redis: {}", e);
        }
        info!("all services closed");
    }
}

pub type SharedState = Arc<AppState>;

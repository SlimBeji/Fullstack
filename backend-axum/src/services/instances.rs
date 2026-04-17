use std::sync::Arc;
use tokio::join;
use tracing::{error, info};

use crate::config::ENV;
use crate::lib_::clients::{
    CloudStorage, CloudStorageConfig, HuggingFaceClient, HuggingFaceClientConfig, PgClient,
    PgClientConfig, RedisClient, RedisClientConfig,
};

// Postgresql

pub async fn get_pgclient() -> PgClient {
    let pgconfig = PgClientConfig {
        url: ENV.get_active_database(),
        max_idle_conns: 5,
        max_open_conns: 25,
        conn_max_lifetime: 3600,
        conn_max_idle_time: 300,
    };

    PgClient::new(pgconfig)
        .await
        .expect("could not establish connection with postgresql database")
}

// Redis

pub async fn get_redis_client() -> RedisClient {
    let redis_config = RedisClientConfig {
        url: ENV.get_active_redis(),
        expiration: ENV.redis_expiration,
    };
    RedisClient::new(redis_config)
        .await
        .expect("could not establish connection with redis database")
}

// Cloud Storage

pub async fn get_storage_client() -> CloudStorage {
    let credentials_file = if ENV.google_credentials.is_empty() {
        None
    } else {
        Some(ENV.google_credentials.clone())
    };

    let storage_config = CloudStorageConfig {
        project_id: ENV.gcp_project_id.clone(),
        bucket_name: ENV.gcs_bucket_name.clone(),
        access_expiration: ENV.gcs_blob_expiration as u64,
        credentials_file,
        emulator_private_url: ENV.gcs_emulator_priv.clone(),
        emulator_public_url: ENV.gcs_emulator_pub.clone(),
    };
    CloudStorage::new(storage_config)
        .await
        .expect("could not create storage client")
}

// HuggingFace

pub async fn get_hf_client() -> HuggingFaceClient {
    let hf_config = HuggingFaceClientConfig {
        token: ENV.hf_api_token.clone(),
        timeout: ENV.default_timeout,
        embed_model: String::from(""),
    };
    HuggingFaceClient::new(hf_config)
        .await
        .expect("could not establish connection with HuggingFace client")
}

// App State

pub struct AppState {
    pub pg: PgClient,
    pub redis: RedisClient,
    pub storage: CloudStorage,
}

impl AppState {
    pub async fn new() -> Self {
        let pg = get_pgclient().await;
        let redis = get_redis_client().await;
        let storage = get_storage_client().await;
        Self { pg, redis, storage }
    }

    pub async fn close(self) {
        let (pg_result, redis_result, storage_result) =
            join!(self.pg.close(), self.redis.close(), self.storage.close());

        if let Err(e) = pg_result {
            error!("failed to close PstgreSQL: {}", e);
        }
        if let Err(e) = redis_result {
            error!("failed to close Redis: {}", e);
        }
        if let Err(e) = storage_result {
            error!("failed to close Storage Client: {}", e);
        }
        info!("all services closed");
    }
}

pub type SharedState = Arc<AppState>;

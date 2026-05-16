use redis::{AsyncCommands, Client, RedisError, aio::MultiplexedConnection};
use serde::{Serialize, de::DeserializeOwned};
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct RedisClientConfig {
    pub url: String,
    pub expiration: usize,
}

pub struct RedisClient {
    client: MultiplexedConnection,
    expiration: Duration,
}

impl RedisClient {
    pub async fn new(config: RedisClientConfig) -> Result<Self, RedisError> {
        let client = Client::open(config.url)?;
        let mut conn = client.get_multiplexed_async_connection().await?;

        // Test connection
        redis::cmd("PING").query_async::<String>(&mut conn).await?;

        Ok(Self {
            client: conn,
            expiration: Duration::from_secs(config.expiration as u64),
        })
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>, RedisError> {
        self.client.clone().get(key).await
    }

    pub async fn get_struct<T: DeserializeOwned>(
        &self,
        key: &str,
    ) -> Result<Option<T>, RedisError> {
        let search: Option<String> = self.client.clone().get(key).await?;
        if let Some(raw) = search {
            let result = serde_json::from_str::<T>(&raw).map(Some).map_err(|err| {
                RedisError::from((
                    redis::ErrorKind::Io,
                    "could not deserialize data",
                    err.to_string(),
                ))
            });

            // Delete key if failed to deserialize
            if result.is_err() {
                self.delete(key).await?;
            }

            result
        } else {
            Ok(None)
        }
    }

    pub async fn set<T: Serialize>(&self, key: &str, val: T) -> Result<(), RedisError> {
        let data = serde_json::to_string(&val).map_err(|err| {
            RedisError::from((
                redis::ErrorKind::Io,
                "could not serialize data",
                err.to_string(),
            ))
        })?;
        self.client
            .clone()
            .set_ex(key, data, self.expiration.as_secs())
            .await
    }

    pub async fn delete(&self, key: &str) -> Result<(), RedisError> {
        self.client.clone().del(key).await
    }

    pub async fn flush_all(&self) -> Result<(), RedisError> {
        self.client.clone().flushall().await
    }

    pub async fn close(self) -> Result<(), RedisError> {
        // MultiplexedConnection drops automatically
        Ok(())
    }
}

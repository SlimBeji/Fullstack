use redis::{AsyncCommands, Client, RedisError, aio::MultiplexedConnection};
use serde::{Serialize, de::DeserializeOwned};
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct RedisClientConfig {
    pub url: String,
    pub expiration: Duration,
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
        let _: String = redis::cmd("PING").query_async(&mut conn).await?;

        Ok(Self {
            client: conn,
            expiration: config.expiration,
        })
    }

    pub async fn get(
        &mut self,
        key: &str,
    ) -> Result<Option<String>, RedisError> {
        self.client.get(key).await
    }

    pub async fn get_struct<T: DeserializeOwned>(
        &mut self,
        key: &str,
    ) -> Result<Option<T>, RedisError> {
        let search: Option<String> = self.client.get(key).await?;
        if let Some(raw) = search {
            serde_json::from_str::<T>(&raw).map(Some).map_err(|err| {
                RedisError::from((
                    redis::ErrorKind::Io,
                    "could not deserialize data",
                    err.to_string(),
                ))
            })
        } else {
            Ok(None)
        }
    }

    pub async fn set<T: Serialize>(
        &mut self,
        key: &str,
        val: T,
    ) -> Result<(), RedisError> {
        let data = serde_json::to_string(&val).map_err(|err| {
            RedisError::from((
                redis::ErrorKind::Io,
                "could not serialize data",
                err.to_string(),
            ))
        })?;
        self.client
            .set_ex(key, data, self.expiration.as_secs())
            .await
    }

    pub async fn delete(&mut self, key: &str) -> Result<(), RedisError> {
        self.client.del(key).await
    }

    pub async fn flush_all(&mut self) -> Result<(), RedisError> {
        self.client.flushall().await
    }

    pub async fn close(self) -> Result<(), RedisError> {
        // MultiplexedConnection drops automatically
        Ok(())
    }
}

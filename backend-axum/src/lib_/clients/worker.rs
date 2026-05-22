use apalis::prelude::*;
use apalis_redis::{ConnectionManager, RedisStorage};
use redis::RedisError;
use serde::{Serialize, de::DeserializeOwned};

#[derive(Clone)]
pub struct TaskPublisher {
    client: ConnectionManager,
}

impl TaskPublisher {
    pub async fn new(broker_url: &str) -> Result<Self, RedisError> {
        let client = apalis_redis::connect(broker_url).await?;
        Ok(Self { client })
    }

    pub async fn push<T>(&self, job: T) -> Result<(), TaskSinkError<RedisError>>
    where
        T: Serialize + DeserializeOwned + Send + Sync + Unpin + 'static,
    {
        RedisStorage::<T>::new(self.client.clone()).push(job).await
    }

    pub async fn close(self) -> Result<(), RedisError> {
        // ConnectionManager drops automatically
        Ok(())
    }
}

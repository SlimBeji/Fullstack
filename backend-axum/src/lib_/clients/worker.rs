use std::{error::Error, fmt};

use apalis::prelude::*;
use apalis_core::backend::Vacuum;
use apalis_redis::{ConnectionManager, RedisStorage};
use redis::RedisError;
use serde::{Serialize, de::DeserializeOwned};
use serde_json::Value;

// Task Publisher

#[derive(Clone)]
pub struct TaskPublisher {
    pub client: ConnectionManager,
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

    pub async fn vacuum<T>(&self) -> Result<(), HandlerError>
    where
        T: Serialize + DeserializeOwned + Send + Sync + Unpin + 'static,
    {
        let type_name = std::any::type_name::<T>();
        RedisStorage::<T>::new(self.client.clone())
            .vacuum()
            .await
            .map_err(|err| HandlerError {
                taskname: "vacuum_apalis".to_string(),
                message: format!("failed to vacuum {type_name} data"),
                details: Value::String(err.to_string()),
            })?;
        Ok(())
    }

    pub async fn close(self) -> Result<(), RedisError> {
        // ConnectionManager drops automatically
        Ok(())
    }
}

// Task Handler

#[derive(Debug, Serialize)]
pub struct HandlerError {
    pub taskname: String,
    pub message: String,
    pub details: Value,
}

impl fmt::Display for HandlerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let result = serde_json::to_string(self)
            .unwrap_or(format!("TaskError {} - {}", self.taskname, self.message));

        write!(f, "{result}")
    }
}

impl Error for HandlerError {}

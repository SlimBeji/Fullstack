use reqwest::{Client, Error as ReqwestError, Response};
use std::time::Duration;

use crate::lib_::types_::{ApiError, SimpleError};

#[derive(Debug, Clone)]
pub struct HuggingFaceClientConfig {
    pub token: String,
    pub embed_model: String,
    pub timeout: usize,
}

pub struct HuggingFaceClient {
    client: Client,
    config: HuggingFaceClientConfig,
}

impl HuggingFaceClient {
    pub async fn new(config: HuggingFaceClientConfig) -> Result<Self, ReqwestError> {
        let client = Client::builder()
            .timeout(Duration::from_secs(config.timeout as u64))
            .build()?;

        let embed_model = if config.embed_model.is_empty() {
            "sentence-transformers/all-MiniLM-L6-v2".to_string()
        } else {
            config.embed_model.clone()
        };

        let config = HuggingFaceClientConfig {
            embed_model,
            ..config
        };

        Ok(Self { client, config })
    }

    fn base_url(&self) -> String {
        format!(
            "https://router.huggingface.co/hf-inference/models/{}/pipeline/feature-extraction",
            self.config.embed_model
        )
    }

    pub async fn embed_text(&self, text: &str) -> Result<Vec<f32>, ApiError> {
        if text.is_empty() {
            return Err(ApiError::internal_error(
                "text cannot be empty",
                Box::new(SimpleError::from("text cannot be empty")),
            ));
        }

        let url = self.base_url();
        let body = serde_json::json!({ "inputs": [text] });

        let resp: Response = self
            .client
            .post(&url)
            .bearer_auth(&self.config.token)
            .json(&body)
            .send()
            .await
            .map_err(|e| {
                ApiError::failed_dependency("embedding server could not be reached", Box::new(e))
            })?;

        if !resp.status().is_success() {
            return Err(ApiError::failed_dependency(
                "embedding server failed",
                Box::new(SimpleError::from(format!(
                    "server returned {} HTTP response",
                    resp.status()
                ))),
            ));
        }

        let embedding_response: Vec<Vec<f32>> = resp.json().await.map_err(|e| {
            ApiError::failed_dependency("failed to parse embedding server response", Box::new(e))
        })?;

        if embedding_response.is_empty() || embedding_response[0].is_empty() {
            return Err(ApiError::failed_dependency(
                "server response did not return embedding vector",
                Box::new(SimpleError::from("server response empty")),
            ));
        }

        Ok(embedding_response[0].clone())
    }

    pub async fn close(self) -> Result<(), String> {
        // reqwest client drops automatically
        Ok(())
    }
}

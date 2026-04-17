use reqwest::{Client, Error as ReqwestError, Response, StatusCode};
use serde_json::Value;
use std::time::Duration;

use crate::lib_::types_::ApiError;

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
            return Err(ApiError {
                code: StatusCode::FAILED_DEPENDENCY,
                message: "text cannot be empty".into(),
                details: None,
                err: None,
            });
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
            .map_err(|e| ApiError {
                code: StatusCode::FAILED_DEPENDENCY,
                message: "embedding server could not be reached".into(),
                details: Some(Value::String(e.to_string())),
                err: None,
            })?;

        if !resp.status().is_success() {
            return Err(ApiError {
                code: StatusCode::FAILED_DEPENDENCY,
                message: "embedding server failed".into(),
                details: Some(Value::String(format!(
                    "server returned {} HTTP response",
                    resp.status()
                ))),
                err: None,
            });
        }

        let embedding_response: Vec<Vec<f32>> = resp.json().await.map_err(|e| ApiError {
            code: StatusCode::FAILED_DEPENDENCY,
            message: "failed to parse embedding server response".into(),
            details: Some(Value::String(e.to_string())),
            err: None,
        })?;

        if embedding_response.is_empty() || embedding_response[0].is_empty() {
            return Err(ApiError {
                code: StatusCode::FAILED_DEPENDENCY,
                message: "server response did not return embedding vector".into(),
                details: None,
                err: None,
            });
        }

        Ok(embedding_response[0].clone())
    }

    pub async fn close(self) -> Result<(), String> {
        // reqwest client drops automatically
        Ok(())
    }
}

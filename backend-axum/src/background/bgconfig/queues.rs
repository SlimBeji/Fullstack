use serde::{Deserialize, Serialize};

use crate::background::bgconfig::{PlaceEmbeddingTask, SendEmailTask};

// --- Email tasks ---------

pub const EMAIL_QUEUE: &str = "emails";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum EmailJob {
    Send(SendEmailTask),
}

// --- AI tasks ---------

pub const AI_QUEUE: &str = "ai";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum AIJob {
    PlaceEmbedding(PlaceEmbeddingTask),
}

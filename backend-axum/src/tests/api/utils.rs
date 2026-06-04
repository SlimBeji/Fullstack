use std::sync::Arc;

use axum::{Router, body, response::Response};
use serde_json::Value;

use crate::api;
use crate::lib_::types_::FileToUpload;
use crate::models::cruds::CrudsUser;
use crate::models::examples::seed::{dump_db, seed_db};
use crate::models::schemas::UserRead;
use crate::services::SharedState;
use crate::services::instances::AppState;

pub async fn setup() -> (Router, SharedState) {
    let app_state = Arc::new(AppState::new().await);
    dump_db(app_state.clone(), false).await;
    seed_db(app_state.clone(), false).await;
    (api::get_app().with_state(app_state.clone()), app_state)
}

pub async fn get_admin_user(state: SharedState) -> (UserRead, String) {
    let cruds = CrudsUser::new(state);
    cruds
        .get_user_with_bearer("mslimbeji@gmail.com")
        .await
        .expect("test error")
}

pub async fn get_simple_user(state: SharedState) -> (UserRead, String) {
    let cruds = CrudsUser::new(state);
    cruds
        .get_user_with_bearer("beji.slim@yahoo.fr")
        .await
        .expect("test error")
}

pub async fn parse_json(response: Response) -> Value {
    let bytes = body::to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("test errot");
    serde_json::from_slice(&bytes).expect("test error")
}

pub fn get_content_type(response: &Response) -> &str {
    response
        .headers()
        .get("Content-Type")
        .expect("test error")
        .to_str()
        .expect("test error")
}

pub struct MultipartTestRequest {
    boundary: String,
    body: Vec<u8>,
}

impl MultipartTestRequest {
    pub fn new() -> Self {
        Self {
            boundary: "testboundary".to_string(),
            body: Vec::new(),
        }
    }

    pub fn add_field(mut self, name: &str, value: &str) -> Self {
        let boundary = &self.boundary;
        self.body.extend_from_slice(
            format!(
                "--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n"
            )
            .as_bytes(),
        );
        self
    }

    pub fn add_file(mut self, field_name: &str, file_path: &str) -> Self {
        let boundary = &self.boundary;
        let file = FileToUpload::from_path(file_path).expect("test error");
        self.body.extend_from_slice(
            format!(
                "--{boundary}\r\nContent-Disposition: form-data; name=\"{field_name}\"; filename=\"{}\"\r\nContent-Type: image/jpeg\r\n\r\n",
                file.originalname
            )
            .as_bytes(),
        );
        self.body.extend_from_slice(&file.data);
        self.body.extend_from_slice(b"\r\n");
        self
    }

    pub fn build(mut self) -> (String, Vec<u8>) {
        let boundary = &self.boundary;
        self.body
            .extend_from_slice(format!("--{boundary}--\r\n").as_bytes());
        (
            format!("multipart/form-data; boundary={}", self.boundary),
            self.body,
        )
    }
}

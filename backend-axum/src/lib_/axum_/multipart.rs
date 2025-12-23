use std::collections::HashMap;

use axum::extract::{FromRequest, multipart};
use axum::http::StatusCode;
use axum::{Json, extract::Request};
use serde_json::{Value, json};

use crate::lib_::types_::FileToUpload;
use crate::lib_::utils;

pub enum MultipartField {
    Text(String),
    File(FileToUpload),
}

impl MultipartField {
    async fn file_from_field(
        field: multipart::Field<'_>,
    ) -> Result<Self, (StatusCode, Json<Value>)> {
        let originalname = field
                .file_name()
                .ok_or((
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "could not read filename of the uploaded file"}))
                ))?
                .to_string();
        let mimetype = field
            .content_type()
            .ok_or((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "did not find uploaded file mimetype"})),
            ))?
            .to_string();
        let data = field
            .bytes()
            .await
            .map_err(|e| {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": e.to_string()})),
                )
            })?
            .to_vec();

        Ok(Self::File(FileToUpload {
            originalname,
            mimetype,
            data,
        }))
    }

    async fn text_from_field(
        field: multipart::Field<'_>,
    ) -> Result<Self, (StatusCode, Json<Value>)> {
        let text = field.text().await.map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("error in parsing multipart request: {}", e.to_string())}))
            )
        })?;
        Ok(Self::Text(text))
    }

    async fn from_field(
        field: multipart::Field<'_>,
    ) -> Result<Self, (StatusCode, Json<Value>)> {
        if field.file_name().is_some() {
            // File variant
            Self::file_from_field(field).await
        } else {
            // Text variant
            Self::text_from_field(field).await
        }
    }
}

pub struct MultipartForm {
    inner: HashMap<String, MultipartField>,
}

#[allow(dead_code)]
impl MultipartForm {
    fn new(inner: HashMap<String, MultipartField>) -> Self {
        Self { inner }
    }

    pub fn get_text(
        &self,
        key: &str,
    ) -> Result<String, (StatusCode, Json<Value>)> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => Ok(s.clone()),
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(
                    json!({"error": format!("could not extract text field {}", key)}),
                ),
            )),
        }
    }

    pub fn get_text_optional(
        &self,
        key: &str,
    ) -> Result<Option<String>, (StatusCode, Json<Value>)> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => Ok(Some(s.clone())),
            None => Ok(None),
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(json!({"error": format!("could not read field {}", key)})),
            )),
        }
    }

    pub fn get_number<T>(
        &self,
        key: &str,
    ) -> Result<T, (StatusCode, Json<Value>)>
    where
        T: std::str::FromStr,
        T::Err: std::fmt::Display,
    {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                let number = s.parse::<T>().map_err(|e| {
                    (StatusCode::UNPROCESSABLE_ENTITY,
                    Json(json!({"error": format!("Invalid number for field {}: {}", key, e)})))
                })?;
                Ok(number)
            }
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(
                    json!({"error": format!("could not extract numeric field {}", key)}),
                ),
            )),
        }
    }

    pub fn get_number_optional<T>(
        &self,
        key: &str,
    ) -> Result<Option<T>, (StatusCode, Json<Value>)>
    where
        T: std::str::FromStr,
        T::Err: std::fmt::Display,
    {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                let number = s.parse::<T>().map_err(|e| {
                    (StatusCode::UNPROCESSABLE_ENTITY,
                    Json(json!({"error": format!("Invalid number for field {}: {}", key, e)})))
                })?;
                Ok(Some(number))
            }
            None => Ok(None),
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(
                    json!({"error": format!("could not extract numeric field {}", key)}),
                ),
            )),
        }
    }

    pub fn get_boolean(
        &self,
        key: &str,
    ) -> Result<bool, (StatusCode, Json<Value>)> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                let result = match utils::parse_bool(s.to_lowercase().as_str())
                {
                    Ok(b) => Ok(b),
                    _ => Err((
                        StatusCode::UNPROCESSABLE_ENTITY,
                        Json(
                            json!({"error": format!("field {} is not a valid boolean: {}", key, s)}),
                        ),
                    )),
                };
                result
            }
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(
                    json!({"error": format!("could not read boolean field {}", key)}),
                ),
            )),
        }
    }

    pub fn get_boolean_optional(
        &self,
        key: &str,
    ) -> Result<Option<bool>, (StatusCode, Json<Value>)> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                let result = match utils::parse_bool(s.to_lowercase().as_str())
                {
                    Ok(b) => Ok(b),
                    _ => Err((
                        StatusCode::UNPROCESSABLE_ENTITY,
                        Json(
                            json!({"error": format!("field {} is not a valid boolean: {}", key, s)}),
                        ),
                    )),
                };
                Ok(Some(result?))
            }
            None => Ok(None),
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(
                    json!({"error": format!("could not read boolean field {}", key)}),
                ),
            )),
        }
    }

    pub fn get_file(
        &self,
        key: &str,
    ) -> Result<FileToUpload, (StatusCode, Json<Value>)> {
        match self.inner.get(key) {
            Some(MultipartField::File(f)) => Ok(f.clone()),
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(
                    json!({"error":format!("Could not extract file for field {}", key)}),
                ),
            )),
        }
    }

    pub fn get_file_optional(
        &self,
        key: &str,
    ) -> Result<Option<FileToUpload>, (StatusCode, Json<Value>)> {
        match self.inner.get(key) {
            Some(MultipartField::File(f)) => Ok(Some(f.clone())),
            None => Ok(None),
            _ => Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(
                    json!({"error":format!("Could not read file for field {}", key)}),
                ),
            )),
        }
    }

    pub async fn parse_multipart_request<S>(
        req: Request,
        state: &S,
    ) -> Result<MultipartForm, (StatusCode, Json<Value>)>
    where
        S: Send + Sync,
    {
        let mut multipart = multipart::Multipart::from_request(req, state).await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("Could not parse multipart request: {}", e)}))
        )
    })?;
        let mut map = HashMap::new();

        while let Some(field) = multipart.next_field().await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("Could not process multipart request: {}", e)}))
        )
    })? {
        let name = field.name().unwrap_or("");
        if name == "" {
            continue;
        }
        map.insert(name.to_string(), MultipartField::from_field(field).await?);
    };
        Ok(MultipartForm::new(map))
    }
}

use std::collections::HashMap;

use axum::extract::{FromRequest, Request, multipart};

use crate::lib_::{axum_::ApiError, types_::FileToUpload, utils};

pub enum MultipartField {
    Text(String),
    File(FileToUpload),
}

impl MultipartField {
    async fn file_from_field(
        name: &str,
        field: multipart::Field<'_>,
    ) -> Result<Self, ApiError> {
        let originalname = field
            .file_name()
            .ok_or(ApiError::bad_multipart_field(
                name,
                "could not read filename",
            ))?
            .to_string();
        let mimetype = field
            .content_type()
            .ok_or(ApiError::bad_multipart_field(
                name,
                "could not guess file mimetype",
            ))?
            .to_string();
        let data = field
            .bytes()
            .await
            .map_err(|e| ApiError::bad_multipart_field(name, e.to_string()))?
            .to_vec();

        Ok(Self::File(FileToUpload {
            originalname,
            mimetype,
            data,
        }))
    }

    async fn text_from_field(
        name: &str,
        field: multipart::Field<'_>,
    ) -> Result<Self, ApiError> {
        let text = field
            .text()
            .await
            .map_err(|e| ApiError::bad_multipart_field(name, e.to_string()))?;
        Ok(Self::Text(text))
    }

    async fn from_field(
        name: &str,
        field: multipart::Field<'_>,
    ) -> Result<Self, ApiError> {
        if field.file_name().is_some() {
            // File variant
            Self::file_from_field(name, field).await
        } else {
            // Text variant
            Self::text_from_field(name, field).await
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

    pub fn get_text(&self, key: &str) -> Result<String, ApiError> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => Ok(s.clone()),
            _ => Err(ApiError::bad_multipart_field(
                key,
                "could not extract text",
            )),
        }
    }

    pub fn get_text_optional(
        &self,
        key: &str,
    ) -> Result<Option<String>, ApiError> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => Ok(Some(s.clone())),
            None => Ok(None),
            _ => {
                Err(ApiError::bad_multipart_field(key, "could not read field"))
            }
        }
    }

    pub fn get_number<T>(&self, key: &str) -> Result<T, ApiError>
    where
        T: std::str::FromStr,
        T::Err: std::fmt::Display,
    {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                let number = s.parse::<T>().map_err(|e| {
                    ApiError::bad_multipart_field(
                        key,
                        format!("invalid numeric value: {}", e),
                    )
                })?;
                Ok(number)
            }
            _ => Err(ApiError::bad_multipart_field(
                key,
                "could not extract numeric value",
            )),
        }
    }

    pub fn get_number_optional<T>(
        &self,
        key: &str,
    ) -> Result<Option<T>, ApiError>
    where
        T: std::str::FromStr,
        T::Err: std::fmt::Display,
    {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                let number = s.parse::<T>().map_err(|e| {
                    ApiError::bad_multipart_field(
                        key,
                        format!("Invalid number: {}", e),
                    )
                })?;
                Ok(Some(number))
            }
            None => Ok(None),
            _ => Err(ApiError::bad_multipart_field(
                key,
                "could not extract numeric value",
            )),
        }
    }

    pub fn get_boolean(&self, key: &str) -> Result<bool, ApiError> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                match utils::parse_bool(s.to_lowercase().as_str()) {
                    Ok(b) => Ok(b),
                    _ => Err(ApiError::bad_multipart_field(
                        key,
                        format!("{} is not a valid boolean", s),
                    )),
                }
            }
            _ => Err(ApiError::bad_multipart_field(
                key,
                "could not extract boolean value",
            )),
        }
    }

    pub fn get_boolean_optional(
        &self,
        key: &str,
    ) -> Result<Option<bool>, ApiError> {
        match self.inner.get(key) {
            Some(MultipartField::Text(s)) => {
                let result = match utils::parse_bool(s.to_lowercase().as_str())
                {
                    Ok(b) => Ok(b),
                    _ => Err(ApiError::bad_multipart_field(
                        key,
                        format!("{} is not a valid boolean", s),
                    )),
                };
                Ok(Some(result?))
            }
            None => Ok(None),
            _ => Err(ApiError::bad_multipart_field(
                key,
                "could not extract boolean value",
            )),
        }
    }

    pub fn get_file(&self, key: &str) -> Result<FileToUpload, ApiError> {
        match self.inner.get(key) {
            Some(MultipartField::File(f)) => Ok(f.clone()),
            _ => Err(ApiError::bad_multipart_field(
                key,
                "Could not extract file",
            )),
        }
    }

    pub fn get_file_optional(
        &self,
        key: &str,
    ) -> Result<Option<FileToUpload>, ApiError> {
        match self.inner.get(key) {
            Some(MultipartField::File(f)) => Ok(Some(f.clone())),
            None => Ok(None),
            _ => Err(ApiError::bad_multipart_field(key, "Could not read file")),
        }
    }

    pub async fn parse_multipart_request<S>(
        req: Request,
        state: &S,
    ) -> Result<MultipartForm, ApiError>
    where
        S: Send + Sync,
    {
        let mut multipart = multipart::Multipart::from_request(req, state)
            .await
            .map_err(|e| {
                ApiError::multipart_parsing_error(
                    "Could not parse multipart request",
                    Box::new(e),
                )
            })?;
        let mut map = HashMap::new();

        while let Some(field) = multipart.next_field().await.map_err(|e| {
            ApiError::multipart_parsing_error(
                "Could not process multipart request",
                Box::new(e),
            )
        })? {
            let Some(name) = field.name().map(|s| s.to_string()) else {
                continue;
            };
            map.insert(
                name.clone(),
                MultipartField::from_field(&name, field).await?,
            );
        }
        Ok(MultipartForm::new(map))
    }
}

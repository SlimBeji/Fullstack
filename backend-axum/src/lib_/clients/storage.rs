use google_cloud_auth::credentials::CredentialsFile;
use google_cloud_storage::client::{Client, ClientConfig};
use google_cloud_storage::http::buckets::get::GetBucketRequest;
use google_cloud_storage::http::buckets::insert::{
    BucketCreationConfig, InsertBucketParam, InsertBucketRequest,
};
use google_cloud_storage::http::objects::delete::DeleteObjectRequest;
use google_cloud_storage::http::objects::upload::{
    Media, UploadObjectRequest, UploadType,
};
use google_cloud_storage::sign::{SignedURLMethod, SignedURLOptions};
use std::time::Duration;
use uuid::Uuid;

use crate::lib_::types_::{ApiError, FileToUpload};

#[derive(Debug, Clone)]
pub struct CloudStorageConfig {
    pub project_id: String,
    pub bucket_name: String,
    pub access_expiration: u64,
    pub credentials_file: Option<String>,
    pub emulator_public_url: Option<String>,
    pub emulator_private_url: Option<String>,
}

impl CloudStorageConfig {
    pub fn is_emulator(&self) -> bool {
        self.emulator_private_url.is_some()
            && self.emulator_public_url.is_some()
    }

    pub fn get_emulator_private_url(&self) -> Option<String> {
        self.emulator_private_url.as_deref().map(|base| {
            if base.ends_with("/storage/v1/") {
                base.trim_end_matches("/").to_string()
            } else {
                format!("{}/storage/v1", base.trim_end_matches('/'))
            }
        })
    }
}

pub struct CloudStorage {
    client: Client,
    config: CloudStorageConfig,
}

impl CloudStorage {
    pub async fn new(config: CloudStorageConfig) -> Result<Self, String> {
        if config.bucket_name.is_empty() {
            return Err("bucket name is required".to_string());
        }

        let client_config = if config.is_emulator() {
            ClientConfig {
                storage_endpoint: config
                    .get_emulator_private_url()
                    .expect("failed to get emulator private url"),
                token_source_provider: None,
                ..Default::default()
            }
        } else if let Some(path) = &config.credentials_file {
            let creds = CredentialsFile::new_from_file(path.clone())
                .await
                .expect("could not read gcs credentials file: {}");
            ClientConfig::default()
                .with_credentials(creds)
                .await
                .expect("could not build gcs client")
        } else {
            return Err(
                "credentials file required for non-emulator mode".to_string()
            );
        };

        let is_emulator = config.is_emulator();
        let client = Client::new(client_config);
        let cs = Self { client, config };

        if is_emulator {
            cs.init_emulator().await?;
        }

        Ok(cs)
    }

    async fn init_emulator(&self) -> Result<(), String> {
        let exists = self
            .client
            .get_bucket(&GetBucketRequest {
                bucket: self.config.bucket_name.clone(),
                ..Default::default()
            })
            .await;

        if exists.is_ok() {
            return Ok(());
        }

        let result = self
            .client
            .insert_bucket(&InsertBucketRequest {
                name: self.config.bucket_name.clone(),
                param: InsertBucketParam {
                    project: self.config.project_id.clone(),
                    ..Default::default()
                },
                bucket: BucketCreationConfig::default(),
            })
            .await;

        match result {
            Ok(_) => {
                println!(
                    "Created bucket {} in emulator",
                    self.config.bucket_name
                );
                Ok(())
            }
            Err(e) => {
                if e.to_string().contains("409")
                    || e.to_string().contains("already")
                {
                    return Ok(());
                }
                Err(format!("failed to create emulator bucket: {}", e))
            }
        }
    }

    fn get_emulator_file_url(&self, filename: &str) -> String {
        let public_url = self
            .config
            .emulator_public_url
            .as_deref()
            .expect("emulator public url was not set");
        let encoded = urlencoding::encode(filename);
        format!(
            "{}/download/storage/v1/b/{}/o/{}?alt=media",
            public_url, self.config.bucket_name, encoded,
        )
    }

    pub async fn get_signed_url(
        &self,
        filename: &str,
        expiration: Option<u64>,
    ) -> Result<String, ApiError> {
        if self.config.is_emulator() {
            return Ok(self.get_emulator_file_url(filename));
        }

        let exp = expiration.unwrap_or(self.config.access_expiration);
        let options = SignedURLOptions {
            method: SignedURLMethod::GET,
            expires: Duration::from_secs(exp),
            ..Default::default()
        };

        self.client
            .signed_url(&self.config.bucket_name, filename, None, None, options)
            .await
            .map_err(|err| {
                ApiError::failed_depency(
                    "storage server could not sign the url",
                    Box::new(err),
                )
            })
    }

    pub async fn upload_file(
        &self,
        file: FileToUpload,
        destination: Option<String>,
    ) -> Result<String, ApiError> {
        // Handle Filename
        let destination = destination.unwrap_or(file.originalname);
        let path = std::path::Path::new(&destination);
        let ext = path
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();
        let base = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "file".into());
        let filename =
            format!("{}_{}{}", base, Uuid::new_v4(), ext).to_lowercase();

        // Upload File
        let req = UploadObjectRequest {
            bucket: self.config.bucket_name.clone(),
            ..Default::default()
        };
        let mut media = Media::new(filename.clone());
        media.content_type = file.mimetype.to_string().into();
        self.client
            .upload_object(&req, file.data, &UploadType::Simple(media))
            .await
            .map_err(|err| {
                ApiError::failed_depency("upload failed", Box::new(err))
            })?;

        Ok(filename)
    }

    pub async fn upload_from_path(
        &self,
        path: String,
        destination: Option<String>,
    ) -> Result<String, ApiError> {
        let file = FileToUpload::from_path(path).map_err(|e| {
            ApiError::failed_depency("could not read file", Box::new(e))
        })?;
        self.upload_file(file, destination).await
    }

    pub async fn delete_file(&self, filename: &str) -> Result<bool, ApiError> {
        let req = DeleteObjectRequest {
            bucket: self.config.bucket_name.clone(),
            object: filename.to_string(),
            ..Default::default()
        };

        match self.client.delete_object(&req).await {
            Ok(_) => Ok(true),
            Err(err) if err.to_string().contains("No such object") => Ok(false),
            Err(err) => Err(ApiError::failed_depency(
                "failed to delete file",
                Box::new(err),
            )),
        }
    }

    pub async fn close(self) -> Result<(), String> {
        // google_cloud_storage::client::Client is automatically cleaned
        Ok(())
    }
}

use std::{env, str::FromStr};

use serde::Deserialize;
use std::sync::LazyLock;

#[derive(Debug, Deserialize, Clone)]
pub struct Settings {
    // Env Config
    pub port: u16,
    //pub api_url: String,
    //pub app_url: String,
    //pub secret_key: String,
    //pub file_upload_max_size: u64,
    //pub json_max_size: u64,
    //pub max_items_per_page: u64,
    //pub god_mode_login: String,
    //pub jwt_expiration: u64,
    //pub default_timeout: u64,
    pub env: String,
    // DATABASE config
    //pub mongo_url: String,
    //pub mongo_db_name: String,
    //pub mongo_test_db_name: String,
    //pub redis_url: String,
    //pub redis_test_url: String,
    //pub redis_expiration: u64,

    // HUGGING FACE config
    //pub hf_api_token: String,

    // GCP config
    //pub google_credentials: String,
    //pub gcp_project_id: String,
    //pub gcs_bucket_name: String,
    //pub gcs_blob_expiration: u64,
    //pub gcs_emulator_priv: String,
    //pub gcs_emulator_pub: String,
}

impl Settings {
    fn new() -> Result<Self, String> {
        Ok(Settings {
            // Env Config
            port: env_to_num(&get_env_or("PORT", "5002"))?,
            //api_url: get_env_or("API_URL", "http://localhost:5002/api"),
            //app_url: get_env("APP_URL")?,
            //secret_key: get_env("SECRET_KEY")?,
            //file_upload_max_size: env_to_num(&get_env_or("FILEUPLOAD_MAX_SIZE","100",))?,
            //json_max_size: env_to_num(&get_env_or("JSON_MAX_SIZE", "10240"))?,
            //max_items_per_page: env_to_num(&get_env_or("MAX_ITEMS_PER_PAGE","100",))?,
            //god_mode_login: get_env("GOD_MODE_LOGIN")?,
            //jwt_expiration: env_to_num(&get_env_or("JWT_EXPIRATION", "3600"))?,
            //default_timeout: env_to_num(&get_env_or("DEFAULT_TIMEOUT", "30"))?,
            env: get_env("ENV")?,
            // DATABASE config
            //mongo_url: get_env("MONGO_URL")?,
            //mongo_db_name: get_env("MONGO_DBNAME")?,
            //mongo_test_db_name: get_env_or("MONGO_TEST_DBNAME", "tests"),
            //redis_url: get_env("REDIS_URL")?,
            //redis_test_url: get_env_or("REDIS_TEST_URL", ""),
            //redis_expiration: env_to_num(&get_env_or("REDIS_DEFAULT_EXPIRATION","3600",))?,

            // HUGGING FACE config
            //hf_api_token: get_env("HF_API_TOKEN")?,

            // GCP config
            //google_credentials: get_env_or("GOOGLE_APPLICATION_CREDENTIALS","",),
            //gcp_project_id: get_env("GCP_PROJECT_ID")?,
            //gcs_bucket_name: get_env("GCS_BUCKET_NAME")?,
            //gcs_blob_expiration: env_to_num(&get_env_or("GCS_BLOB_ACCESS_EXPIRATION","3600",))?,
            //gcs_emulator_priv: get_env_or("GCS_EMULATOR_PRIVATE_URL", ""),
            //gcs_emulator_pub: get_env_or("GCS_EMULATOR_PUBLIC_URL", ""),
        })
    }

    pub fn bind_addr(&self) -> String {
        format!("0.0.0.0:{}", self.port)
    }

    pub fn trace_lvl(&self) -> tracing::Level {
        if self.env == "dev" {
            tracing::Level::TRACE
        } else {
            tracing::Level::INFO
        }
    }
}

fn get_env(key: &str) -> Result<String, String> {
    env::var(key).map_err(|_| format!("Missing env variable {}", key))
}

fn get_env_or(key: &str, default: &str) -> String {
    env::var(key).unwrap_or(default.to_string())
}

fn env_to_num<T: FromStr>(value: &str) -> Result<T, String> {
    value
        .parse()
        .map_err(|_| format!("Failed to parse {} to numeric value", value))
}

pub static ENV: LazyLock<Settings> =
    LazyLock::new(|| Settings::new().unwrap_or_else(|err| panic!("{}", err)));

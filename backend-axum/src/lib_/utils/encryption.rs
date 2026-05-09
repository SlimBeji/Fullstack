use std::collections::HashMap;

use bcrypt::BcryptError;
use serde_json::Value;
use time::{Duration, OffsetDateTime};

use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation};

// Hashing

pub fn hash_input(input: &str, cost: u32) -> Result<String, BcryptError> {
    bcrypt::hash(input, cost)
}

pub fn verify_hash(plain: &str, hashed: &str) -> bool {
    bcrypt::verify(plain, hashed).unwrap_or(false)
}

pub fn is_hashed(input: &str) -> bool {
    // Cheap check to see if a value is hashed or not
    if input.len() != 60 {
        return false;
    }
    input.starts_with("$2a$") || input.starts_with("$2b$") || input.starts_with("$2y$")
}

// Encoding

pub fn encode_payload(
    mut payload: HashMap<String, Value>,
    secret: &str,
    expiration: Duration,
) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = (OffsetDateTime::now_utc() + expiration).unix_timestamp();
    payload.insert("exp".into(), Value::Number(exp.into()));
    jsonwebtoken::encode(
        &Header::default(),
        &payload,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn decode_payload(encoded: &str, secret: &str) -> Result<HashMap<String, Value>, String> {
    let mut validation = Validation::default();
    validation.validate_exp = true;
    let token_data = jsonwebtoken::decode::<HashMap<String, Value>>(
        encoded,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|err| match err.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => "token expired".to_string(),
        _ => "token not valid".to_string(),
    })?;
    Ok(token_data.claims)
}

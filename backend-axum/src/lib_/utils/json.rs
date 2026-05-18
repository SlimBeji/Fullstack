use serde::Serialize;
use serde_json::Value;
use time::{OffsetDateTime, format_description::well_known::Rfc3339};

use crate::lib_::types_::SimpleError;

pub fn parse_enum_array<T: Serialize>(arr: Option<Vec<T>>) -> Vec<String> {
    arr.unwrap_or_default()
        .iter()
        .map(|field| {
            serde_json::to_string(field).expect("failded to convert enum variant to a string")
        })
        .map(|s| s.trim_matches('"').to_string())
        .collect()
}

pub fn get_id_from_json(key: &str, json: &Value) -> Result<u32, SimpleError> {
    let Some(val) = json.get(key) else {
        return Err(SimpleError::from(format!("No '{key}' value found")));
    };
    let id = val
        .as_u64()
        .map(|v| v as u32)
        .ok_or_else(|| format!("'{key}' is not a valid integer"))?;

    Ok(id)
}

pub fn get_opt_id_from_json(key: &str, json: &Value) -> Result<Option<u32>, SimpleError> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };
    let id = val
        .as_u64()
        .map(|v| v as u32)
        .ok_or_else(|| format!("'{key}' is not a valid integer"))?;

    Ok(Some(id))
}

pub fn get_f64_from_json(key: &str, json: &Value) -> Result<f64, SimpleError> {
    let Some(val) = json.get(key) else {
        return Err(SimpleError::from(format!("No '{key}' value found")));
    };
    let id = val
        .as_f64()
        .ok_or_else(|| format!("'{key}' is not a valid float"))?;

    Ok(id)
}

pub fn get_opt_f64_from_json(key: &str, json: &Value) -> Result<Option<f64>, SimpleError> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };
    let id = val
        .as_f64()
        .ok_or_else(|| format!("'{key}' is not a valid float"))?;

    Ok(Some(id))
}

pub fn get_string_from_json(key: &str, json: &Value) -> Result<String, SimpleError> {
    let Some(val) = json.get(key) else {
        return Err(SimpleError::from(format!("No '{key}' value found")));
    };
    let s = val
        .as_str()
        .map(|v| v.to_string())
        .ok_or_else(|| format!("'{key}' is not a string"))?;

    Ok(s)
}

pub fn get_opt_string_from_json(key: &str, json: &Value) -> Result<Option<String>, SimpleError> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };
    let s = val
        .as_str()
        .map(|v| v.to_string())
        .ok_or_else(|| format!("'{key}' is not a string"))?;

    Ok(Some(s))
}

pub fn get_bool_from_json(key: &str, json: &Value) -> Result<bool, SimpleError> {
    let Some(val) = json.get(key) else {
        return Err(SimpleError::from(format!("No '{key}' value found")));
    };
    let b = val
        .as_bool()
        .ok_or_else(|| format!("'{key}' is not a boolean"))?;

    Ok(b)
}

pub fn get_opt_bool_from_json(key: &str, json: &Value) -> Result<Option<bool>, SimpleError> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };
    let b = val
        .as_bool()
        .ok_or_else(|| format!("'{key}' is not a boolean"))?;

    Ok(Some(b))
}

pub fn get_datetime_from_json(key: &str, json: &Value) -> Result<OffsetDateTime, SimpleError> {
    let Some(val) = json.get(key) else {
        return Err(SimpleError::from(format!("No '{key}' value found")));
    };
    let Some(s) = val.as_str() else {
        return Err(SimpleError::from(format!("'{key}' is not a string")));
    };
    let datetime = OffsetDateTime::parse(s, &Rfc3339)
        .map_err(|e| format!("'{key}' is not a valid datetime: {e}"))?;

    Ok(datetime)
}

pub fn get_opt_datetime_from_json(
    key: &str,
    json: &Value,
) -> Result<Option<OffsetDateTime>, SimpleError> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };
    let Some(s) = val.as_str() else {
        return Err(SimpleError::from(format!(
            "'{key}' is not a valid datetime"
        )));
    };
    let datetime = OffsetDateTime::parse(s, &Rfc3339)
        .map_err(|e| format!("'{key}' is not a valid datetime: {e}"))?;

    Ok(Some(datetime))
}

pub fn get_value_from_json<'a>(key: &str, json: &'a Value) -> Result<&'a Value, SimpleError> {
    let Some(val) = json.get(key) else {
        return Err(SimpleError::from(format!("No '{key}' value found")));
    };
    Ok(val)
}

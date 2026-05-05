use serde::Serialize;
use serde_json::Value;
use time::{OffsetDateTime, format_description::well_known::Rfc3339};

pub fn parse_enum_array<T: Serialize>(arr: Option<Vec<T>>) -> Vec<String> {
    arr.unwrap_or_default()
        .iter()
        .map(|field| {
            serde_json::to_string(field).expect("failded to convert enum variant to a string")
        })
        .map(|s| s.trim_matches('"').to_string())
        .collect()
}

pub fn get_id_from_json(key: &str, json: &Value) -> Result<Option<u32>, String> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };

    let id = val
        .as_u64()
        .map(|v| v as u32)
        .ok_or_else(|| format!("'{key}' is not a valid integer"))?;

    Ok(Some(id))
}

pub fn get_string_from_json(key: &str, json: &Value) -> Result<Option<String>, String> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };

    let s = val
        .as_str()
        .map(|v| v.to_string())
        .ok_or_else(|| format!("'{key}' is not a string"))?;

    Ok(Some(s))
}

pub fn get_bool_from_json(key: &str, json: &Value) -> Result<Option<bool>, String> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };

    let b = val
        .as_bool()
        .ok_or_else(|| format!("'{key}' is not a boolean"))?;

    Ok(Some(b))
}

pub fn get_datetime_from_json(key: &str, json: &Value) -> Result<Option<OffsetDateTime>, String> {
    let Some(val) = json.get(key) else {
        return Ok(None);
    };

    let Some(s) = val.as_str() else {
        return Err(format!("'{key}' is not a string"));
    };

    let datetime = OffsetDateTime::parse(s, &Rfc3339)
        .map_err(|e| format!("'{key}' is not a valid datetime: {e}"))?;

    Ok(Some(datetime))
}

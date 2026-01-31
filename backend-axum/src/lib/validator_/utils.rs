use serde_json::{Map, Value, json};
use validator::{ValidationError, ValidationErrors};

pub fn errors_to_serde_map(
    validation_errors: &ValidationErrors,
) -> Map<String, Value> {
    let mut map = serde_json::Map::new();
    for (field, errors) in validation_errors.field_errors() {
        let arr: Vec<Value> = errors
            .iter()
            .map(|err: &ValidationError| {
                json!({
                    "code": err.code,
                    "message": err.message.clone().map(|m| m.to_string()),
                    "params": err.params,
                })
            })
            .collect();
        map.insert(field.to_string(), Value::Array(arr));
    }
    map
}

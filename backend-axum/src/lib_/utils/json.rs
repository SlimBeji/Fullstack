use serde::Serialize;

pub fn parse_enum_array<T: Serialize>(arr: Option<Vec<T>>) -> Vec<String> {
    arr.unwrap_or_default()
        .iter()
        .map(|field| {
            serde_json::to_string(field)
                .expect("failded to convert enum variant to a string")
        })
        .map(|s| s.trim_matches('"').to_string())
        .collect()
}

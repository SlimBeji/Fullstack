use serde::Deserialize;

pub fn deserialize_f64_or_string<'de, D>(deserializer: D) -> Result<f64, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StringOrFloat {
        Float(f64),
        String(String),
    }

    match StringOrFloat::deserialize(deserializer)? {
        StringOrFloat::Float(f) => Ok(f),
        StringOrFloat::String(s) => s.parse::<f64>().map_err(serde::de::Error::custom),
    }
}

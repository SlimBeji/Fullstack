pub fn parse_bool(s: &str) -> Result<bool, String> {
    match s {
        "true" | "t" | "yes" | "y" | "1" => Ok(true),
        "false" | "f" | "no" | "n" | "0" => Ok(false),
        _ => Err(format!("{} is not a valid boolean", s)),
    }
}

use once_cell::sync::Lazy;
use regex::Regex;

pub static OBJECT_ID_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[0-9a-fA-F]{24}$").expect("OBJECT_ID regex did not compile")
});

pub static TOKEN_TYPE_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^bearer$").expect("TOKEN_TYPE regex did not compile")
});

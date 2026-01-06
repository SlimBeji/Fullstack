use validator::ValidationError;

use super::regex::OBJECT_ID_REGEX;

pub fn object_id(id: &str) -> Result<(), ValidationError> {
    if OBJECT_ID_REGEX.is_match(id) {
        Ok(())
    } else {
        let mut err = ValidationError::new("invalid_object_id");
        err.message = Some("Must be a 24-character hexadecimal string".into());
        Err(err)
    }
}

pub fn email_strict(email: &str) -> Result<(), ValidationError> {
    if !email.contains('@') {
        let mut err = ValidationError::new("email_invalid_format");
        err.message = Some("Email must contain '@' symbol".into());
        return Err(err);
    }

    let (_, domain) = email.split_once('@').ok_or_else(|| {
        let mut err = ValidationError::new("email_invalid_format");
        err.message =
            Some("Email must have a valid format (local@domain)".into());
        err
    })?;

    if !domain.contains('.') {
        let mut err = ValidationError::new("email_missing_tld");
        err.message = Some(
            "Email domain must contain a top-level domain (e.g., '.com')"
                .into(),
        );
        return Err(err);
    }

    Ok(())
}

pub fn token_type(t: &str) -> Result<(), ValidationError> {
    if t != "bearer" {
        let mut err = ValidationError::new("invalid_token_type");
        err.message = Some("Token type must be 'bearer'".into());
        return Err(err);
    }
    Ok(())
}

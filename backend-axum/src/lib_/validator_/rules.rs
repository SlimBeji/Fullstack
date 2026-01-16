use validator::ValidationError;

use super::regex::OBJECT_ID_REGEX;

pub fn string_length<const MIN: usize, const MAX: usize>(
    value: &str,
) -> Result<(), ValidationError> {
    let len = value.len();

    // Build appropriate message based on constraints
    let msg = if MAX > 0 && MIN == 0 {
        format!("value must be at most {} characters", MAX)
    } else if MAX == 0 && MIN > 0 {
        format!("value must be at least {} characters", MIN)
    } else if MAX == MIN && MAX > 0 {
        format!("value must be exactly {} characters", MIN)
    } else if MAX > 0 && MIN > 0 {
        format!("value must be between {} and {} characters", MIN, MAX)
    } else {
        return Ok(()); // MAX=0 and MIN=0
    };

    // Check too short
    if MIN > 0 && len < MIN {
        let mut err = ValidationError::new("string_too_short");
        err.message = Some(msg.into());
        return Err(err);
    }

    // Check too long
    if MAX > 0 && len > MAX {
        let mut err = ValidationError::new("string_too_long");
        err.message = Some(msg.into());
        return Err(err);
    }

    Ok(())
}

pub fn array_length<T, const MIN: usize, const MAX: usize>(
    value: &[T],
) -> Result<(), ValidationError> {
    let len = value.len();

    let msg = if MAX > 0 && MIN == 0 {
        format!("array must have at most {} items", MAX)
    } else if MAX == 0 && MIN > 0 {
        format!("array must have at least {} items", MIN)
    } else if MAX == MIN && MAX > 0 {
        format!("array must have exactly {} items", MIN)
    } else if MAX > 0 && MIN > 0 {
        format!("array must have between {} and {} items", MIN, MAX)
    } else {
        return Ok(());
    };

    if MIN > 0 && len < MIN {
        let mut err = ValidationError::new("array_too_short");
        err.message = Some(msg.into());
        return Err(err);
    }

    if MAX > 0 && len > MAX {
        let mut err = ValidationError::new("array_too_long");
        err.message = Some(msg.into());
        return Err(err);
    }

    Ok(())
}

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

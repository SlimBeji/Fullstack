use mongodb::bson::oid::ObjectId;
use std::collections::HashMap;
use time::OffsetDateTime;
use validator::{ValidationError, ValidationErrors};

use crate::lib_::utils::parse_bool as parse_bool_utils;

// General helpers methods
pub type Validators<T> = Vec<fn(&T) -> Result<(), ValidationError>>;

fn apply_rules<T>(
    val: &T,
    rules: &Validators<T>,
) -> Result<(), ValidationError> {
    for rule in rules {
        rule(val)?
    }
    Ok(())
}

fn apply_rules_to_slice<T>(
    vals: &[T],
    rules: &Validators<T>,
) -> Result<(), ValidationError> {
    for val in vals {
        for rule in rules {
            rule(val)?
        }
    }
    Ok(())
}

fn apply_str_rules(
    val: &str,
    rules: &Validators<str>,
) -> Result<(), ValidationError> {
    // validator crate wants &str even when validating String
    // apply_rules works with only one generic type not (&str, &String)
    for rule in rules {
        rule(val)?
    }
    Ok(())
}

fn apply_str_rules_to_slice(
    vals: &[String],
    rules: &Validators<str>,
) -> Result<(), ValidationError> {
    // validator crate wants &str even when validating String
    // apply_rules_to_slice works with only one generic type not (&str, &String)
    for val in vals {
        for rule in rules {
            rule(val)?
        }
    }
    Ok(())
}

fn parse_str_filter(filter: &str) -> (&str, &str) {
    filter.split_once(':').unwrap_or(("eq", filter))
}

fn is_usable<'a>(
    key: &'a str,
    operators: &mut Vec<&'a str>,
) -> Result<(), ValidationError> {
    if operators.contains(&key) {
        let mut err = ValidationError::new("duplicate_operator");
        err.message =
            Some(format!("cannot use {} operator multiple times", key).into());
        return Err(err);
    }
    operators.push(key);
    if key != "eq" && operators.contains(&"eq") {
        let mut err = ValidationError::new("incompatible_operators");
        err.message = Some(
            format!(
                "eq can only be used exclusively. {} used at the same time",
                operators.join(", ")
            )
            .into(),
        );
        return Err(err);
    }
    Ok(())
}

fn parse_bool(val: &str) -> Result<bool, ValidationError> {
    parse_bool_utils(val).map_err(|e| {
        let mut err = ValidationError::new("invalid_boolean");
        err.message = Some(e.into());
        err
    })
}

fn parse_number(val: &str) -> Result<f64, ValidationError> {
    let trimmed = val.trim();
    if trimmed.is_empty() {
        let mut err = ValidationError::new("not_a_number");
        err.message = Some("Empty string is not a valid number".into());
        return Err(err);
    }

    let num: f64 = trimmed.parse().map_err(|e| {
        let mut err = ValidationError::new("not_a_number");
        err.message =
            Some(format!("'{}' is not a valid number: {}", val, e).into());
        err
    })?;

    if num.is_nan() {
        let mut err = ValidationError::new("not_a_number");
        err.message = Some("Value is not a number (NaN)".into());
        return Err(err);
    }

    Ok(num)
}

fn parse_numbers(val: &str) -> Result<Vec<f64>, ValidationError> {
    val.split(',').try_fold(Vec::new(), |mut acc, item| {
        acc.push(parse_number(item)?);
        Ok(acc)
    })
}

fn parse_object_id(val: &str) -> Result<ObjectId, ValidationError> {
    ObjectId::parse_str(val).map_err(|e| {
        let mut err = ValidationError::new("invalid_object_id");
        err.message =
            Some(format!("'{}' is not a valid ObjectId: {}", val, e).into());
        err
    })
}

fn parse_objects_id(val: &str) -> Result<Vec<ObjectId>, ValidationError> {
    val.split(',').try_fold(Vec::new(), |mut acc, item| {
        acc.push(parse_object_id(item)?);
        Ok(acc)
    })
}

fn parse_datetime(val: &str) -> Result<OffsetDateTime, ValidationError> {
    OffsetDateTime::parse(val, &time::format_description::well_known::Rfc3339)
        .map_err(|e| {
            let mut err = ValidationError::new("invalid_datetime");
            err.message = Some(
                format!("'{}' is not a valid datetime: {}", val, e).into(),
            );
            err
        })
}

fn parse_datetimes(val: &str) -> Result<Vec<OffsetDateTime>, ValidationError> {
    val.split(',').map(|s| parse_datetime(s.trim())).collect()
}

// String Filters
#[derive(Debug)]
pub struct StringFilters {
    pub eq: Option<String>,
    pub ne: Option<String>,
    pub in_: Option<Vec<String>>,
    pub nin: Option<Vec<String>>,
    pub exists: Option<bool>,
    pub regex: Option<String>,
    pub text: Option<String>,
}

impl StringFilters {
    pub fn from_list(
        filters: &[String],
        rules: &Validators<str>,
        is_indexed: bool,
    ) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            in_: None,
            nin: None,
            exists: None,
            regex: None,
            text: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter);
            match op {
                "eq" => {
                    is_usable("eq", &mut operators)?;
                    let converted = val.to_string();
                    apply_str_rules(&converted, rules)?;
                    result.eq = Some(converted);
                }
                "ne" => {
                    is_usable("ne", &mut operators)?;
                    let converted = val.to_string();
                    apply_str_rules(&converted, rules)?;
                    result.ne = Some(converted);
                }
                "in" => {
                    is_usable("in", &mut operators)?;
                    let converted: Vec<String> =
                        val.split(',').map(|e| e.to_string()).collect();
                    apply_str_rules_to_slice(&converted, rules)?;
                    result.in_ = Some(converted);
                }
                "nin" => {
                    is_usable("nin", &mut operators)?;
                    let converted: Vec<String> =
                        val.split(',').map(|e| e.to_string()).collect();
                    apply_str_rules_to_slice(&converted, rules)?;
                    result.nin = Some(converted);
                }
                "exists" => {
                    is_usable("exists", &mut operators)?;
                    let converted = parse_bool(val)?;
                    // No validation
                    result.exists = Some(converted);
                }
                "regex" => {
                    is_usable("regex", &mut operators)?;
                    let converted = val.to_string();
                    // No validation
                    result.regex = Some(converted);
                }
                "text" => {
                    if !is_indexed {
                        let mut err = ValidationError::new("bad_operator");
                        err.message = Some(
                            "cannot use text operator on non-indexed fields"
                                .into(),
                        );
                        return Err(err);
                    }
                    is_usable("text", &mut operators)?;
                    let converted = val.to_string();
                    // No validation
                    result.text = Some(converted);
                }
                _ => {
                    let mut err = ValidationError::new("unknown_operator");
                    err.message = Some(format!(
                        "{} not valid! use: eq, ne, in, nin, exists, regex, text",
                        op
                    ).into());
                    return Err(err);
                }
            }
        }
        Ok(result)
    }
}

// Numeric Filters
#[derive(Debug)]
pub struct NumericFilters {
    pub eq: Option<f64>,
    pub ne: Option<f64>,
    pub gt: Option<f64>,
    pub gte: Option<f64>,
    pub lt: Option<f64>,
    pub lte: Option<f64>,
    pub in_: Option<Vec<f64>>,
    pub nin: Option<Vec<f64>>,
    pub exists: Option<bool>,
}

impl NumericFilters {
    pub fn from_list(
        filters: &[String],
        rules: &Validators<f64>,
    ) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            gt: None,
            gte: None,
            lt: None,
            lte: None,
            in_: None,
            nin: None,
            exists: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter);
            match op {
                "eq" => {
                    is_usable("eq", &mut operators)?;
                    let converted = parse_number(val)?;
                    apply_rules(&converted, rules)?;
                    result.eq = Some(converted);
                }
                "ne" => {
                    is_usable("ne", &mut operators)?;
                    let converted = parse_number(val)?;
                    apply_rules(&converted, rules)?;
                    result.ne = Some(converted);
                }
                "gt" => {
                    is_usable("gt", &mut operators)?;
                    let converted = parse_number(val)?;
                    apply_rules(&converted, rules)?;
                    result.gt = Some(converted);
                }
                "gte" => {
                    is_usable("gte", &mut operators)?;
                    let converted = parse_number(val)?;
                    apply_rules(&converted, rules)?;
                    result.gte = Some(converted);
                }
                "lt" => {
                    is_usable("lt", &mut operators)?;
                    let converted = parse_number(val)?;
                    apply_rules(&converted, rules)?;
                    result.lt = Some(converted);
                }
                "lte" => {
                    is_usable("lte", &mut operators)?;
                    let converted = parse_number(val)?;
                    apply_rules(&converted, rules)?;
                    result.lte = Some(converted);
                }
                "in" => {
                    is_usable("in", &mut operators)?;
                    let converted = parse_numbers(val)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.in_ = Some(converted);
                }
                "nin" => {
                    is_usable("nin", &mut operators)?;
                    let converted = parse_numbers(val)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.nin = Some(converted);
                }
                "exists" => {
                    is_usable("exists", &mut operators)?;
                    let converted = parse_bool(val)?;
                    // No validation
                    result.exists = Some(converted);
                }
                _ => {
                    let mut err = ValidationError::new("unknown_operator");
                    err.message = Some(format!(
                        "{} not valid! use: eq, ne, gt, gte, lt, lte, in, nin, exists",
                        op
                    ).into());
                    return Err(err);
                }
            }
        }
        Ok(result)
    }
}

// Boolean Filters
#[derive(Debug)]
pub struct BooleanFilters {
    pub eq: Option<bool>,
    pub ne: Option<bool>,
    pub exists: Option<bool>,
}

impl BooleanFilters {
    pub fn from_list(filters: &[String]) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            exists: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter);
            match op {
                "eq" => {
                    is_usable("eq", &mut operators)?;
                    let converted = parse_bool(val)?;
                    // No validation
                    result.eq = Some(converted);
                }
                "ne" => {
                    is_usable("ne", &mut operators)?;
                    let converted = parse_bool(val)?;
                    // No validation
                    result.ne = Some(converted);
                }
                "exists" => {
                    is_usable("exists", &mut operators)?;
                    let converted = parse_bool(val)?;
                    // No validation
                    result.exists = Some(converted);
                }
                _ => {
                    let mut err = ValidationError::new("unknown_operator");
                    err.message = Some(
                        format!("{} not valid! use: eq, ne, exists", op).into(),
                    );
                    return Err(err);
                }
            }
        }
        Ok(result)
    }
}

// ObjectId Filters
#[derive(Debug)]
pub struct ObjectIdFilters {
    pub eq: Option<ObjectId>,
    pub ne: Option<ObjectId>,
    pub in_: Option<Vec<ObjectId>>,
    pub nin: Option<Vec<ObjectId>>,
    pub exists: Option<bool>,
}

impl ObjectIdFilters {
    pub fn from_list(filters: &[String]) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            in_: None,
            nin: None,
            exists: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter);
            match op {
                "eq" => {
                    is_usable("eq", &mut operators)?;
                    let converted = parse_object_id(val)?;
                    // No validation
                    result.eq = Some(converted);
                }
                "ne" => {
                    is_usable("ne", &mut operators)?;
                    let converted = parse_object_id(val)?;
                    // No validation
                    result.ne = Some(converted);
                }
                "in" => {
                    is_usable("in", &mut operators)?;
                    let converted = parse_objects_id(val)?;
                    // No validation
                    result.in_ = Some(converted);
                }
                "nin" => {
                    is_usable("nin", &mut operators)?;
                    let converted = parse_objects_id(val)?;
                    // No validation
                    result.nin = Some(converted);
                }
                "exists" => {
                    is_usable("exists", &mut operators)?;
                    let converted = parse_bool(val)?;
                    // No validation
                    result.exists = Some(converted);
                }
                _ => {
                    let mut err = ValidationError::new("unknown_operator");
                    err.message = Some(
                        format!(
                            "{} not valid! use: eq, ne, in, nin, exists",
                            op
                        )
                        .into(),
                    );
                    return Err(err);
                }
            }
        }
        Ok(result)
    }
}

// Datetime Filters
#[derive(Debug)]
pub struct DatetimeFilters {
    pub eq: Option<OffsetDateTime>,
    pub ne: Option<OffsetDateTime>,
    pub gt: Option<OffsetDateTime>,
    pub gte: Option<OffsetDateTime>,
    pub lt: Option<OffsetDateTime>,
    pub lte: Option<OffsetDateTime>,
    pub in_: Option<Vec<OffsetDateTime>>,
    pub nin: Option<Vec<OffsetDateTime>>,
    pub exists: Option<bool>,
}

impl DatetimeFilters {
    pub fn from_list(
        filters: &[String],
        rules: &Validators<OffsetDateTime>,
    ) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            gt: None,
            gte: None,
            lt: None,
            lte: None,
            in_: None,
            nin: None,
            exists: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter);
            match op {
                "eq" => {
                    is_usable("eq", &mut operators)?;
                    let converted = parse_datetime(val)?;
                    apply_rules(&converted, rules)?;
                    result.eq = Some(converted);
                }
                "ne" => {
                    is_usable("ne", &mut operators)?;
                    let converted = parse_datetime(val)?;
                    apply_rules(&converted, rules)?;
                    result.ne = Some(converted);
                }
                "gt" => {
                    is_usable("gt", &mut operators)?;
                    let converted = parse_datetime(val)?;
                    apply_rules(&converted, rules)?;
                    result.gt = Some(converted);
                }
                "gte" => {
                    is_usable("gte", &mut operators)?;
                    let converted = parse_datetime(val)?;
                    apply_rules(&converted, rules)?;
                    result.gte = Some(converted);
                }
                "lt" => {
                    is_usable("lt", &mut operators)?;
                    let converted = parse_datetime(val)?;
                    apply_rules(&converted, rules)?;
                    result.lt = Some(converted);
                }
                "lte" => {
                    is_usable("lte", &mut operators)?;
                    let converted = parse_datetime(val)?;
                    apply_rules(&converted, rules)?;
                    result.lte = Some(converted);
                }
                "in" => {
                    is_usable("in", &mut operators)?;
                    let converted = parse_datetimes(val)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.in_ = Some(converted);
                }
                "nin" => {
                    is_usable("nin", &mut operators)?;
                    let converted = parse_datetimes(val)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.nin = Some(converted);
                }
                "exists" => {
                    is_usable("exists", &mut operators)?;
                    let converted = parse_bool(val)?;
                    // No validation
                    result.exists = Some(converted);
                }
                _ => {
                    let mut err = ValidationError::new("unknown_operator");
                    err.message = Some(format!(
                        "{} not valid! use: eq, ne, gt, gte, lt, lte, in, nin, exists",
                        op
                    ).into());
                    return Err(err);
                }
            }
        }
        Ok(result)
    }
}

// General Reader
#[derive(Debug)]
#[allow(dead_code)] // to be removed
pub enum FieldFilters {
    String(StringFilters),
    Numeric(NumericFilters),
    Boolean(BooleanFilters),
    ObjectId(ObjectIdFilters),
    DateTime(DatetimeFilters),
}

pub struct FiltersReader {
    filters: HashMap<String, FieldFilters>,
    errors: ValidationErrors,
}

#[allow(dead_code)]
impl FiltersReader {
    pub fn new() -> Self {
        Self {
            filters: HashMap::new(),
            errors: ValidationErrors::new(),
        }
    }

    pub fn eval(
        self,
    ) -> Result<HashMap<String, FieldFilters>, ValidationErrors> {
        if self.errors.is_empty() {
            Ok(self.filters)
        } else {
            Err(self.errors)
        }
    }

    pub fn read_string_filters(
        &mut self,
        key: &'static str,
        query_params: &Option<Vec<String>>,
        rules: &Validators<str>,
        is_indexed: bool,
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        let parsed = StringFilters::from_list(query_params, rules, is_indexed);
        match parsed {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::String(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }

    pub fn read_numeric_filters(
        &mut self,
        key: &'static str,
        query_params: &Option<Vec<String>>,
        rules: &Validators<f64>,
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        let parsed = NumericFilters::from_list(query_params, rules);
        match parsed {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::Numeric(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }

    pub fn read_boolean_filters(
        &mut self,
        key: &'static str,
        query_params: &Option<Vec<String>>,
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        let parsed = BooleanFilters::from_list(query_params);
        match parsed {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::Boolean(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }

    pub fn read_object_id_filters(
        &mut self,
        key: &'static str,
        query_params: &Option<Vec<String>>,
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        let parsed = ObjectIdFilters::from_list(query_params);
        match parsed {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::ObjectId(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }

    pub fn read_datetime_filters(
        &mut self,
        key: &'static str,
        query_params: &Option<Vec<String>>,
        rules: &Validators<OffsetDateTime>,
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        let parsed = DatetimeFilters::from_list(query_params, rules);
        match parsed {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::DateTime(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }
}

use std::{collections::HashMap, str::FromStr};
use time::OffsetDateTime;
use validator::{ValidationError, ValidationErrors};

use super::super::utils::parse_bool as parse_bool_utils;

// Basic PGSQL operations for querying

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FilterOp {
    Eq,
    Ne,
    Null,
    In,
    Nin,
    Lt,
    Lte,
    Gt,
    Gte,
    Like,
    Ilike,
}

impl FilterOp {
    pub fn as_str(&self) -> &'static str {
        match self {
            FilterOp::Eq => "eq",
            FilterOp::Ne => "ne",
            FilterOp::Null => "null",
            FilterOp::In => "in",
            FilterOp::Nin => "nin",
            FilterOp::Lt => "lt",
            FilterOp::Lte => "lte",
            FilterOp::Gt => "gt",
            FilterOp::Gte => "gte",
            FilterOp::Like => "like",
            FilterOp::Ilike => "ilike",
        }
    }
}

impl std::fmt::Display for FilterOp {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl FromStr for FilterOp {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "eq" => Ok(FilterOp::Eq),
            "ne" => Ok(FilterOp::Ne),
            "null" => Ok(FilterOp::Null),
            "in" => Ok(FilterOp::In),
            "nin" => Ok(FilterOp::Nin),
            "lt" => Ok(FilterOp::Lt),
            "lte" => Ok(FilterOp::Lte),
            "gt" => Ok(FilterOp::Gt),
            "gte" => Ok(FilterOp::Gte),
            "like" => Ok(FilterOp::Like),
            "ilike" => Ok(FilterOp::Ilike),
            _ => Err(s.into()),
        }
    }
}

// Validation Helpers

pub type Validators<T> = Vec<fn(&T) -> Result<(), ValidationError>>;

fn validation_err(code: &'static str, message: String) -> ValidationError {
    let mut err = ValidationError::new(code);
    err.message = Some(message.into());
    err
}

fn unknown_op_error(op: String) -> ValidationError {
    let message = format!(
        "unknown operator {} - use one of the following: {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}",
        op,
        FilterOp::Eq.as_str(),
        FilterOp::Ne.as_str(),
        FilterOp::Null.as_str(),
        FilterOp::In.as_str(),
        FilterOp::Nin.as_str(),
        FilterOp::Lt.as_str(),
        FilterOp::Lte.as_str(),
        FilterOp::Gt.as_str(),
        FilterOp::Gte.as_str(),
        FilterOp::Like.as_str(),
        FilterOp::Ilike.as_str()
    );
    validation_err("unknown_operator", message)
}

// Parsers

fn parse_str_filter(filter: &str) -> Result<(FilterOp, &str), ValidationError> {
    match filter.split_once(':') {
        Some((op_str, val)) => {
            Ok((op_str.parse().map_err(unknown_op_error)?, val))
        }
        None => Ok((FilterOp::Eq, filter)),
    }
}

fn parse_datetime_filter(
    filter: &str,
) -> Result<(FilterOp, &str), ValidationError> {
    if filter.chars().next().is_some_and(|c| c.is_ascii_digit()) {
        // starting with a number - must be an eq filter
        return Ok((FilterOp::Eq, filter));
    }
    // if the filter does not start with a digit than it must contain an operator
    // we can safely pass the filter without risking splitting 18:00 to ("18", "00")
    parse_str_filter(filter)
}

fn parse_bool(val: &str, op: FilterOp) -> Result<bool, ValidationError> {
    parse_bool_utils(val).map_err(|_| {
        let message = format!(
            "{} is not a boolean - cannot be used with operator {}",
            val,
            op.as_str()
        );
        validation_err("not_a_boolean", message)
    })
}

fn parse_f64(val: &str, op: FilterOp) -> Result<f64, ValidationError> {
    let err_fn = || {
        validation_err(
            "not_a_number",
            format!(
                "{} is not a float - cannot be used with operator {}",
                val,
                op.as_str()
            ),
        )
    };

    let trimmed = val.trim();
    if trimmed.is_empty() {
        return Err(err_fn());
    }

    let num: f64 = trimmed.parse().map_err(|_| err_fn())?;
    if num.is_nan() {
        return Err(err_fn());
    }

    Ok(num)
}

fn parse_f64_vec(val: &str, op: FilterOp) -> Result<Vec<f64>, ValidationError> {
    val.split(',').map(|item| parse_f64(item, op)).collect()
}

fn parse_u32(val: &str, op: FilterOp) -> Result<u32, ValidationError> {
    let err_fn = || {
        validation_err(
            "not_a_number",
            format!(
                "{} is not a valid positive integer - cannot be used with operator {}",
                val,
                op.as_str()
            ),
        )
    };

    let trimmed = val.trim();
    if trimmed.is_empty() {
        return Err(err_fn());
    }

    let num: u32 = trimmed.parse().map_err(|_| err_fn())?;
    Ok(num)
}

fn parse_u32_vec(val: &str, op: FilterOp) -> Result<Vec<u32>, ValidationError> {
    val.split(',').map(|item| parse_u32(item, op)).collect()
}

fn parse_datetime(
    val: &str,
    op: FilterOp,
) -> Result<OffsetDateTime, ValidationError> {
    let trimmed = val.trim();
    OffsetDateTime::parse(
        trimmed,
        &time::format_description::well_known::Rfc3339,
    )
    .map_err(|_| {
        validation_err(
            "not_a_datetime",
            format!(
                "{} is not a valid datetime - cannot be used with operator {}",
                val,
                op.as_str()
            ),
        )
    })
}

fn parse_datetime_vec(
    val: &str,
    op: FilterOp,
) -> Result<Vec<OffsetDateTime>, ValidationError> {
    val.split(',')
        .map(|s| parse_datetime(s.trim(), op))
        .collect()
}

// Filter Builders

fn is_usable(
    key: FilterOp,
    operators: &mut Vec<FilterOp>,
) -> Result<(), ValidationError> {
    // Early return: if empty, first operator is always valid
    if operators.is_empty() {
        operators.push(key);
        return Ok(());
    }

    // From here on, length is guaranteed >= 2

    // Rule 0: No operator used twice
    if operators.contains(&key) {
        let message = format!(
            "cannot use operator {} multiple times for the same field",
            key
        );
        return Err(validation_err("duplicate_operator", message));
    }

    // Rule 1: eq should be used exclusively
    if key == FilterOp::Eq || operators.contains(&FilterOp::Eq) {
        let message = format!(
            "{} can only be used exclusively, but found: {:?}",
            FilterOp::Eq.as_str(),
            operators
        );
        return Err(validation_err("incompatible_operators", message));
    }
    // Rule 2: null should be used exclusively (if eq not used)
    else if key == FilterOp::Null || operators.contains(&FilterOp::Null) {
        let message = format!(
            "{} operator should be used exclusively, but found: {:?}",
            FilterOp::Null.as_str(),
            operators
        );
        return Err(validation_err("incompatible_operators", message));
    }
    // Rule 3: in should be used exclusively (if eq or null not used)
    else if key == FilterOp::In || operators.contains(&FilterOp::In) {
        let message = format!(
            "{} operator should be used exclusively, but found: {:?}",
            FilterOp::In.as_str(),
            operators
        );
        return Err(validation_err("incompatible_operators", message));
    }

    // Rule 4: gt/gte cannot be used together
    if (key == FilterOp::Gt && operators.contains(&FilterOp::Gte))
        || (key == FilterOp::Gte && operators.contains(&FilterOp::Gt))
    {
        let message = format!(
            "{} and {} operators should not be used together",
            FilterOp::Gt.as_str(),
            FilterOp::Gte.as_str()
        );
        return Err(validation_err("incompatible_operators", message));
    }

    // Rule 5: lt/lte cannot be used together
    if (key == FilterOp::Lt && operators.contains(&FilterOp::Lte))
        || (key == FilterOp::Lte && operators.contains(&FilterOp::Lt))
    {
        let message = format!(
            "{} and {} operators should not be used together",
            FilterOp::Lt.as_str(),
            FilterOp::Lte.as_str()
        );
        return Err(validation_err("incompatible_operators", message));
    }

    // Rule 6: like/ilike cannot be used together
    if (key == FilterOp::Like && operators.contains(&FilterOp::Ilike))
        || (key == FilterOp::Ilike && operators.contains(&FilterOp::Like))
    {
        let message = format!(
            "{} and {} operators should not be used together",
            FilterOp::Ilike.as_str(),
            FilterOp::Like.as_str()
        );
        return Err(validation_err("incompatible_operators", message));
    }

    operators.push(key);
    Ok(())
}

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
    // In rust, generics must be sized so we cannot use str as T
    // we define apply_str_rules instead of using apply_rules<T>
    for rule in rules {
        rule(val)?
    }
    Ok(())
}

fn apply_str_rules_to_slice(
    vals: &[String],
    rules: &Validators<str>,
) -> Result<(), ValidationError> {
    // In rust, generics must be sized so we cannot use str as T
    // we define apply_str_rules_to_slice instead of using apply_rules_to_slice<T>
    for val in vals {
        for rule in rules {
            rule(val)?
        }
    }
    Ok(())
}

// String Filters

#[derive(Debug)]
pub struct StringFilters {
    pub eq: Option<String>,
    pub ne: Option<String>,
    pub like: Option<String>,
    pub ilike: Option<String>,
    pub null: Option<bool>,
    pub in_: Option<Vec<String>>,
    pub nin: Option<Vec<String>>,
}

impl StringFilters {
    pub fn from_list(
        filters: &[String],
        rules: &Validators<str>,
    ) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            like: None,
            ilike: None,
            null: None,
            in_: None,
            nin: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter)?;
            match op {
                FilterOp::Eq => {
                    is_usable(FilterOp::Eq, &mut operators)?;
                    let converted = val.to_string();
                    apply_str_rules(&converted, rules)?;
                    result.eq = Some(converted);
                }
                FilterOp::Ne => {
                    is_usable(FilterOp::Ne, &mut operators)?;
                    let converted = val.to_string();
                    apply_str_rules(&converted, rules)?;
                    result.ne = Some(converted);
                }
                FilterOp::In => {
                    is_usable(FilterOp::In, &mut operators)?;
                    let converted: Vec<String> =
                        val.split(',').map(|e| e.to_string()).collect();
                    apply_str_rules_to_slice(&converted, rules)?;
                    result.in_ = Some(converted);
                }
                FilterOp::Nin => {
                    is_usable(FilterOp::Nin, &mut operators)?;
                    let converted: Vec<String> =
                        val.split(',').map(|e| e.to_string()).collect();
                    apply_str_rules_to_slice(&converted, rules)?;
                    result.nin = Some(converted);
                }
                FilterOp::Null => {
                    is_usable(FilterOp::Null, &mut operators)?;
                    let converted = parse_bool(val, FilterOp::Null)?;
                    // validation is done through the convertion
                    result.null = Some(converted)
                }
                FilterOp::Like => {
                    is_usable(FilterOp::Like, &mut operators)?;
                    let converted = val.to_string();
                    // No validation for like - it contains partial data
                    result.like = Some(converted);
                }
                FilterOp::Ilike => {
                    is_usable(FilterOp::Ilike, &mut operators)?;
                    let converted = val.to_string();
                    // No validation for like - it contains partial data
                    result.ilike = Some(converted);
                }
                _ => {
                    let message = format!(
                        "wrong string filter operation: {} is not among {},{},{},{},{},{},{}",
                        op,
                        FilterOp::Eq.as_str(),
                        FilterOp::Ne.as_str(),
                        FilterOp::In.as_str(),
                        FilterOp::Nin.as_str(),
                        FilterOp::Null.as_str(),
                        FilterOp::Like.as_str(),
                        FilterOp::Ilike.as_str(),
                    );
                    return Err(validation_err("unknown_operator", message));
                }
            }
        }
        Ok(result)
    }
}

// F64 Filters

#[derive(Debug)]
pub struct F64Filters {
    pub eq: Option<f64>,
    pub ne: Option<f64>,
    pub gt: Option<f64>,
    pub gte: Option<f64>,
    pub lt: Option<f64>,
    pub lte: Option<f64>,
    pub null: Option<bool>,
    pub in_: Option<Vec<f64>>,
    pub nin: Option<Vec<f64>>,
}

impl F64Filters {
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
            null: None,
            in_: None,
            nin: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter)?;
            match op {
                FilterOp::Eq => {
                    is_usable(FilterOp::Eq, &mut operators)?;
                    let converted = parse_f64(val, FilterOp::Eq)?;
                    apply_rules(&converted, rules)?;
                    result.eq = Some(converted);
                }
                FilterOp::Ne => {
                    is_usable(FilterOp::Ne, &mut operators)?;
                    let converted = parse_f64(val, FilterOp::Ne)?;
                    apply_rules(&converted, rules)?;
                    result.ne = Some(converted);
                }
                FilterOp::Gt => {
                    is_usable(FilterOp::Gt, &mut operators)?;
                    let converted = parse_f64(val, FilterOp::Gt)?;
                    apply_rules(&converted, rules)?;
                    result.gt = Some(converted);
                }
                FilterOp::Gte => {
                    is_usable(FilterOp::Gte, &mut operators)?;
                    let converted = parse_f64(val, FilterOp::Gte)?;
                    apply_rules(&converted, rules)?;
                    result.gte = Some(converted);
                }
                FilterOp::Lt => {
                    is_usable(FilterOp::Lt, &mut operators)?;
                    let converted = parse_f64(val, FilterOp::Lt)?;
                    apply_rules(&converted, rules)?;
                    result.lt = Some(converted);
                }
                FilterOp::Lte => {
                    is_usable(FilterOp::Lte, &mut operators)?;
                    let converted = parse_f64(val, FilterOp::Lte)?;
                    apply_rules(&converted, rules)?;
                    result.lte = Some(converted);
                }
                FilterOp::Null => {
                    is_usable(FilterOp::Null, &mut operators)?;
                    let converted = parse_bool(val, FilterOp::Null)?;
                    // validation is done through the convertion
                    result.null = Some(converted)
                }
                FilterOp::In => {
                    is_usable(FilterOp::In, &mut operators)?;
                    let converted = parse_f64_vec(val, FilterOp::In)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.in_ = Some(converted);
                }
                FilterOp::Nin => {
                    is_usable(FilterOp::Nin, &mut operators)?;
                    let converted = parse_f64_vec(val, FilterOp::Nin)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.nin = Some(converted);
                }
                _ => {
                    let message = format!(
                        "wrong float64 filter operation: {} is not among {},{},{},{},{},{},{},{},{}",
                        op,
                        FilterOp::Eq.as_str(),
                        FilterOp::Ne.as_str(),
                        FilterOp::Gt.as_str(),
                        FilterOp::Gte.as_str(),
                        FilterOp::Lt.as_str(),
                        FilterOp::Lte.as_str(),
                        FilterOp::Null.as_str(),
                        FilterOp::In.as_str(),
                        FilterOp::Nin.as_str(),
                    );
                    return Err(validation_err("unknown_operator", message));
                }
            }
        }
        Ok(result)
    }
}

// Index Filters

#[derive(Debug)]
pub struct IndexFilters {
    pub eq: Option<u32>,
    pub ne: Option<u32>,
    pub null: Option<bool>,
    pub in_: Option<Vec<u32>>,
    pub nin: Option<Vec<u32>>,
}

impl IndexFilters {
    pub fn from_list(filters: &[String]) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            null: None,
            in_: None,
            nin: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter)?;
            match op {
                FilterOp::Eq => {
                    is_usable(FilterOp::Eq, &mut operators)?;
                    let converted = parse_u32(val, FilterOp::Eq)?;
                    // no validation for indexes
                    result.eq = Some(converted);
                }
                FilterOp::Ne => {
                    is_usable(FilterOp::Ne, &mut operators)?;
                    let converted = parse_u32(val, FilterOp::Ne)?;
                    // no validation for indexes
                    result.ne = Some(converted);
                }
                FilterOp::Null => {
                    is_usable(FilterOp::Null, &mut operators)?;
                    let converted = parse_bool(val, FilterOp::Null)?;
                    // validation is done through the parsing
                    result.null = Some(converted)
                }
                FilterOp::In => {
                    is_usable(FilterOp::In, &mut operators)?;
                    let converted = parse_u32_vec(val, FilterOp::In)?;
                    // no validation for indexes
                    result.in_ = Some(converted);
                }
                FilterOp::Nin => {
                    is_usable(FilterOp::Nin, &mut operators)?;
                    let converted = parse_u32_vec(val, FilterOp::Nin)?;
                    // no validation for indexes
                    result.nin = Some(converted);
                }
                _ => {
                    let message = format!(
                        "wrong index filter operation: {} is not allowed for indexes, not among {},{},{},{},{}",
                        op,
                        FilterOp::Eq.as_str(),
                        FilterOp::Ne.as_str(),
                        FilterOp::Null.as_str(),
                        FilterOp::In.as_str(),
                        FilterOp::Nin.as_str(),
                    );
                    return Err(validation_err(
                        "unsupported_operator",
                        message,
                    ));
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
    pub null: Option<bool>,
}

impl BooleanFilters {
    pub fn from_list(filters: &[String]) -> Result<Self, ValidationError> {
        let mut result = Self {
            eq: None,
            ne: None,
            null: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_str_filter(filter)?;
            match op {
                FilterOp::Eq => {
                    is_usable(FilterOp::Eq, &mut operators)?;
                    let converted = parse_bool(val, FilterOp::Eq)?;
                    // validation is done through the parsing
                    result.eq = Some(converted);
                }
                FilterOp::Ne => {
                    is_usable(FilterOp::Ne, &mut operators)?;
                    let converted = parse_bool(val, FilterOp::Ne)?;
                    // validation is done through the parsing
                    result.ne = Some(converted);
                }
                FilterOp::Null => {
                    is_usable(FilterOp::Null, &mut operators)?;
                    let converted = parse_bool(val, FilterOp::Null)?;
                    // validation is done through the parsing
                    result.null = Some(converted)
                }
                _ => {
                    let message = format!(
                        "wrong boolean filter operation: {} is not allowed for booleans, not among {},{},{}",
                        op,
                        FilterOp::Eq.as_str(),
                        FilterOp::Ne.as_str(),
                        FilterOp::Null.as_str(),
                    );
                    return Err(validation_err(
                        "unsupported_operator",
                        message,
                    ));
                }
            }
        }
        Ok(result)
    }
}

// Datetime Filters

#[derive(Debug)]
pub struct DateTimeFilters {
    pub eq: Option<OffsetDateTime>,
    pub ne: Option<OffsetDateTime>,
    pub gt: Option<OffsetDateTime>,
    pub gte: Option<OffsetDateTime>,
    pub lt: Option<OffsetDateTime>,
    pub lte: Option<OffsetDateTime>,
    pub null: Option<bool>,
    pub in_: Option<Vec<OffsetDateTime>>,
    pub nin: Option<Vec<OffsetDateTime>>,
}

impl DateTimeFilters {
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
            null: None,
            in_: None,
            nin: None,
        };

        let mut operators = vec![];
        for filter in filters {
            let (op, val) = parse_datetime_filter(filter)?;
            match op {
                FilterOp::Eq => {
                    is_usable(FilterOp::Eq, &mut operators)?;
                    let converted = parse_datetime(val, FilterOp::Eq)?;
                    apply_rules(&converted, rules)?;
                    result.eq = Some(converted);
                }
                FilterOp::Ne => {
                    is_usable(FilterOp::Ne, &mut operators)?;
                    let converted = parse_datetime(val, FilterOp::Ne)?;
                    apply_rules(&converted, rules)?;
                    result.ne = Some(converted);
                }
                FilterOp::Gt => {
                    is_usable(FilterOp::Gt, &mut operators)?;
                    let converted = parse_datetime(val, FilterOp::Gt)?;
                    apply_rules(&converted, rules)?;
                    result.gt = Some(converted);
                }
                FilterOp::Gte => {
                    is_usable(FilterOp::Gte, &mut operators)?;
                    let converted = parse_datetime(val, FilterOp::Gte)?;
                    apply_rules(&converted, rules)?;
                    result.gte = Some(converted);
                }
                FilterOp::Lt => {
                    is_usable(FilterOp::Lt, &mut operators)?;
                    let converted = parse_datetime(val, FilterOp::Lt)?;
                    apply_rules(&converted, rules)?;
                    result.lt = Some(converted);
                }
                FilterOp::Lte => {
                    is_usable(FilterOp::Lte, &mut operators)?;
                    let converted = parse_datetime(val, FilterOp::Lte)?;
                    apply_rules(&converted, rules)?;
                    result.lte = Some(converted);
                }
                FilterOp::Null => {
                    is_usable(FilterOp::Null, &mut operators)?;
                    let converted = parse_bool(val, FilterOp::Null)?;
                    // validation is done through the parsing
                    result.null = Some(converted)
                }
                FilterOp::In => {
                    is_usable(FilterOp::In, &mut operators)?;
                    let converted = parse_datetime_vec(val, FilterOp::In)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.in_ = Some(converted);
                }
                FilterOp::Nin => {
                    is_usable(FilterOp::Nin, &mut operators)?;
                    let converted = parse_datetime_vec(val, FilterOp::Nin)?;
                    apply_rules_to_slice(&converted, rules)?;
                    result.nin = Some(converted);
                }
                _ => {
                    let message = format!(
                        "wrong datetime filter operation: {} is not among {},{},{},{},{},{},{},{},{}",
                        op,
                        FilterOp::Eq.as_str(),
                        FilterOp::Ne.as_str(),
                        FilterOp::Gt.as_str(),
                        FilterOp::Gte.as_str(),
                        FilterOp::Lt.as_str(),
                        FilterOp::Lte.as_str(),
                        FilterOp::Null.as_str(),
                        FilterOp::In.as_str(),
                        FilterOp::Nin.as_str(),
                    );
                    return Err(validation_err(
                        "unsupported_operator",
                        message,
                    ));
                }
            }
        }
        Ok(result)
    }
}

// Genral Type

#[derive(Debug)]
pub enum FieldFilters {
    String(StringFilters),
    F64(F64Filters),
    Index(IndexFilters),
    Boolean(BooleanFilters),
    DateTime(DateTimeFilters),
}

#[derive(Default)]
pub struct FiltersReader {
    filters: HashMap<String, FieldFilters>,
    errors: ValidationErrors,
}

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
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        match StringFilters::from_list(query_params, rules) {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::String(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }

    pub fn read_f64_filters(
        &mut self,
        key: &'static str,
        query_params: &Option<Vec<String>>,
        rules: &Validators<f64>,
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        match F64Filters::from_list(query_params, rules) {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::F64(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }

    pub fn read_index_filters(
        &mut self,
        key: &'static str,
        query_params: &Option<Vec<String>>,
    ) {
        let Some(query_params) = query_params else {
            return;
        };

        match IndexFilters::from_list(query_params) {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::Index(inner));
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

        match BooleanFilters::from_list(query_params) {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::Boolean(inner));
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

        match DateTimeFilters::from_list(query_params, rules) {
            Ok(inner) => {
                self.filters
                    .insert(key.to_string(), FieldFilters::DateTime(inner));
            }
            Err(inner) => self.errors.add(key, inner),
        }
    }
}

pub type WhereFilters = HashMap<String, FieldFilters>;

#[derive(Debug)]
pub struct SearchQuery {
    pub page: usize,
    pub size: usize,
    pub order_by: Vec<String>,
    pub select: Vec<String>,
    pub where_: WhereFilters,
}

pub trait ToSearchQuery {
    fn to_search_query(self) -> Result<SearchQuery, ValidationErrors>;
}

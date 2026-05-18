use chrono::Utc;
use sea_orm::prelude::DateTimeWithTimeZone;
use sea_orm::sea_query::extension::postgres::PgExpr;
use sea_orm::{
    Condition,
    sea_query::{Expr, ExprTrait},
};

use crate::lib_::types_::filters::{
    BooleanFilters, DateTimeFilters, F64Filters, IndexFilters, StringFilters,
};
use crate::lib_::types_::{FieldFilters, SearchableTrait, WhereFilters};

fn string_filters_to_condition(expr: Expr, filters: &StringFilters) -> Condition {
    let mut condition = Condition::all();

    if let Some(eq) = &filters.eq {
        condition = condition.add(expr.clone().eq(eq.clone()));
    }
    if let Some(ne) = &filters.ne {
        condition = condition.add(expr.clone().ne(ne.clone()));
    }
    if let Some(like) = &filters.like {
        condition = condition.add(expr.clone().like(like.clone()));
    }
    if let Some(ilike) = &filters.ilike {
        condition = condition.add(expr.clone().ilike(ilike.clone()));
    }
    if let Some(null) = filters.null {
        if null {
            condition = condition.add(expr.clone().is_null());
        } else {
            condition = condition.add(expr.clone().is_not_null());
        }
    }
    if let Some(in_) = &filters.in_ {
        condition = condition.add(expr.clone().is_in(in_.clone()));
    }
    if let Some(nin) = &filters.nin {
        condition = condition.add(expr.clone().is_not_in(nin.clone()));
    }

    condition
}

fn f64_filters_to_condition(expr: Expr, filters: &F64Filters) -> Condition {
    let mut condition = Condition::all();

    if let Some(eq) = filters.eq {
        condition = condition.add(expr.clone().eq(eq));
    }
    if let Some(ne) = filters.ne {
        condition = condition.add(expr.clone().ne(ne));
    }
    if let Some(gt) = filters.gt {
        condition = condition.add(expr.clone().gt(gt));
    }
    if let Some(gte) = filters.gte {
        condition = condition.add(expr.clone().gte(gte));
    }
    if let Some(lt) = filters.lt {
        condition = condition.add(expr.clone().lt(lt));
    }
    if let Some(lte) = filters.lte {
        condition = condition.add(expr.clone().lte(lte));
    }
    if let Some(null) = filters.null {
        if null {
            condition = condition.add(expr.clone().is_null());
        } else {
            condition = condition.add(expr.clone().is_not_null());
        }
    }
    if let Some(in_) = &filters.in_ {
        condition = condition.add(expr.clone().is_in(in_.clone()));
    }
    if let Some(nin) = &filters.nin {
        condition = condition.add(expr.clone().is_not_in(nin.clone()));
    }

    condition
}

fn index_filters_to_condition(expr: Expr, filters: &IndexFilters) -> Condition {
    let mut condition = Condition::all();

    if let Some(eq) = filters.eq {
        condition = condition.add(expr.clone().eq(eq));
    }
    if let Some(ne) = filters.ne {
        condition = condition.add(expr.clone().ne(ne));
    }
    if let Some(null) = filters.null {
        if null {
            condition = condition.add(expr.clone().is_null());
        } else {
            condition = condition.add(expr.clone().is_not_null());
        }
    }
    if let Some(in_) = &filters.in_ {
        condition = condition.add(expr.clone().is_in(in_.clone()));
    }
    if let Some(nin) = &filters.nin {
        condition = condition.add(expr.clone().is_not_in(nin.clone()));
    }

    condition
}

fn boolean_filters_to_condition(expr: Expr, filters: &BooleanFilters) -> Condition {
    let mut condition = Condition::all();

    if let Some(eq) = filters.eq {
        condition = condition.add(expr.clone().eq(eq));
    }
    if let Some(ne) = filters.ne {
        condition = condition.add(expr.clone().ne(ne));
    }
    if let Some(null) = filters.null {
        if null {
            condition = condition.add(expr.clone().is_null());
        } else {
            condition = condition.add(expr.clone().is_not_null());
        }
    }

    condition
}

fn datetime_filters_to_condition(expr: Expr, filters: &DateTimeFilters) -> Condition {
    let mut condition = Condition::all();

    if let Some(eq) = filters.eq {
        condition = condition.add(expr.clone().eq(eq));
    }
    if let Some(ne) = filters.ne {
        condition = condition.add(expr.clone().ne(ne));
    }
    if let Some(gt) = filters.gt {
        condition = condition.add(expr.clone().gt(gt));
    }
    if let Some(gte) = filters.gte {
        condition = condition.add(expr.clone().gte(gte));
    }
    if let Some(lt) = filters.lt {
        condition = condition.add(expr.clone().lt(lt));
    }
    if let Some(lte) = filters.lte {
        condition = condition.add(expr.clone().lte(lte));
    }
    if let Some(null) = filters.null {
        if null {
            condition = condition.add(expr.clone().is_null());
        } else {
            condition = condition.add(expr.clone().is_not_null());
        }
    }
    if let Some(in_) = &filters.in_ {
        condition = condition.add(expr.clone().is_in(in_.clone()));
    }
    if let Some(nin) = &filters.nin {
        condition = condition.add(expr.clone().is_not_in(nin.clone()));
    }

    condition
}

pub fn to_condition<Searchable: SearchableTrait>(filters: &WhereFilters<Searchable>) -> Condition {
    let mut condition = Condition::all();

    for (field, field_filters) in filters {
        let expr = field.to_expr();
        let field_condition = match field_filters {
            FieldFilters::String(f) => string_filters_to_condition(expr, f),
            FieldFilters::Index(f) => index_filters_to_condition(expr, f),
            FieldFilters::F64(f) => f64_filters_to_condition(expr, f),
            FieldFilters::Boolean(f) => boolean_filters_to_condition(expr, f),
            FieldFilters::DateTime(f) => datetime_filters_to_condition(expr, f),
        };
        condition = condition.add(field_condition);
    }

    condition
}

pub fn now() -> DateTimeWithTimeZone {
    Utc::now().fixed_offset()
}

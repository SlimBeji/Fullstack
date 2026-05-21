use time::error::Parse;
use time::format_description::BorrowedFormatItem;
use time::format_description::well_known::{Iso8601, Rfc3339};
use time::{Date, OffsetDateTime, PrimitiveDateTime, Time};

pub fn parse_bool(s: &str) -> Result<bool, String> {
    match s {
        "true" | "t" | "yes" | "y" | "1" => Ok(true),
        "false" | "f" | "no" | "n" | "0" => Ok(false),
        _ => Err(format!("{} is not a valid boolean", s)),
    }
}

const DATETIME_NO_SECS: &[BorrowedFormatItem<'_>] =
    time::macros::format_description!("[year]-[month]-[day] [hour]:[minute]");

pub fn parse_datetime(s: &str) -> Result<OffsetDateTime, Parse> {
    let s = s.trim();
    OffsetDateTime::parse(s, &Rfc3339)
        .or_else(|_| {
            Date::parse(s, &Iso8601::DATE).map(|d| d.with_time(Time::MIDNIGHT).assume_utc())
        })
        .or_else(|_| PrimitiveDateTime::parse(s, DATETIME_NO_SECS).map(|dt| dt.assume_utc()))
}

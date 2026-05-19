use crate::{models::orm::get_tables, services::instances::AppState};

pub async fn dumb_db(verbose: bool) {
    let app_state = AppState::new().await;
    for tablename in get_tables() {
        let result = app_state.pg.reset_table(tablename).await;
        match result {
            Ok(_) => {
                if verbose {
                    println!("✅ Table {} cleared!", tablename);
                }
            }
            Err(err) => {
                if verbose {
                    println!("Could not reset table {}", tablename);
                    println!("{:?}", err);
                }
                return;
            }
        }

        if result.is_err() && verbose {}
    }

    let result = app_state.redis.flush_all().await;
    match result {
        Ok(_) => {
            if verbose {
                println!("✅ Cache DB flushed");
                println!("✅ Finished. You may exit");
            }
        }
        Err(err) => {
            if verbose {
                println!("Failed to flush redis db");
                println!("{:?}", err);
            }
        }
    }
}

use std::{sync::Arc, time::Duration};
use tokio::join;
use tracing::{error, info};

use crate::config::ENV;
use backend::clients::{PgClient, PgClientConfig};

// Postgresql

pub async fn get_pgclient() -> PgClient {
    let pgconfig = PgClientConfig {
        url: ENV.get_active_database(),
        max_idle_conns: 5,
        max_open_conns: 25,
        conn_max_lifetime: Duration::from_secs(3600),
        conn_max_idle_time: Duration::from_secs(300),
    };

    PgClient::new(pgconfig)
        .await
        .expect("could not establish connection with postgresql database")
}

pub struct AppState {
    pub pg: PgClient,
}

impl AppState {
    pub async fn new() -> Self {
        let pg = get_pgclient().await;
        Self { pg }
    }

    pub async fn close(self) {
        let (pg_result,) = join!(self.pg.close());

        if let Err(e) = pg_result {
            error!("failed to close PstgreSQL: {}", e);
        }
        info!("all services closed");
    }
}

pub type SharedState = Arc<AppState>;

use backend::models::examples::seed::dumb_db;

#[tokio::main]
async fn main() {
    dumb_db(true).await;
}

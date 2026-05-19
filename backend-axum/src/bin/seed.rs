use backend::models::examples::seed::seed_db;

#[tokio::main]
async fn main() {
    seed_db(true).await;
}

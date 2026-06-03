use backend::models::examples::seed::dump_db;

#[tokio::main]
async fn main() {
    dump_db(true).await;
}

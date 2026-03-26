use backend::services::instances::get_pgclient;

#[tokio::main]
async fn main() {
    let pg_clinet = get_pgclient().await;
    let tables = pg_clinet
        .list_tables()
        .await
        .expect("could not extract list of tables");
    println!("{:?}", tables);
}

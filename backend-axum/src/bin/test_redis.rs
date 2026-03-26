use backend::services::instances::get_redis_client;

#[tokio::main]
async fn main() {
    // Get redis client
    let mut redis_client = get_redis_client().await;

    // Test setting and retrieving value
    redis_client
        .set("secret_number", 158)
        .await
        .expect("could not set key value");
    match redis_client
        .get("secret_number")
        .await
        .expect("could not extract key value")
    {
        Some(val) => println!("{}", val),
        None => panic!("value previously set was not found"),
    }

    // Test getting and deleting value
    redis_client
        .delete("secret_number")
        .await
        .expect("could not delete key value");
    match redis_client
        .get("secret_number")
        .await
        .expect("could not extract key value")
    {
        Some(_) => panic!("failed to delete key value"),
        None => println!("key successfully deleted"),
    }
}

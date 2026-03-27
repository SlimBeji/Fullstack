use backend::services::instances::get_hf_client;

#[tokio::main]
async fn main() {
    let hf_client = get_hf_client().await;
    let result = hf_client
        .embed_text("I am trying to debug my code in rust")
        .await;
    match result {
        Ok(vec) => println!("{:?}", vec),
        Err(err) => println!("Something went wrong: {}", err),
    };
}

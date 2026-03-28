use backend::services::instances::get_storage_client;
use backend::static_::get_image_path;

#[tokio::main]
async fn main() {
    // Get storage client
    let path = get_image_path("avatar1.jpg");
    let storage_client = get_storage_client().await;

    // Test uploading a file
    let filename = storage_client
        .upload_from_path(&path, None)
        .await
        .expect("failed to upload file");
    println!("{}", filename);

    // Test getting a signed URL
    let url = storage_client
        .get_signed_url(&filename, None)
        .await
        .expect("failed to sign url");
    println!("{}", url);
}

use std::sync::Arc;

use backend::{
    lib_::{
        seaorm_::{Create, cruds::Read},
        types_::FileToUpload,
    },
    models::{
        cruds::{CrudsUser, UserOptions},
        schemas::{UserPost, UserSelectable},
    },
    services::instances::AppState,
    static_::get_image_path,
};

#[tokio::main]
async fn main() {
    // Initialisation
    let app_state = AppState::new().await;
    let cruds_user = CrudsUser::new(Arc::new(app_state));

    // Creating a record
    let avatar = FileToUpload::from_path(get_image_path("avatar1.jpg").as_str())
        .expect("failed to find avatar");
    let form = UserPost {
        name: "Didier Drogba".to_string(),
        email: "drogba@chelsea.com".to_string(),
        is_admin: false,
        password: "blue_is_the_color".to_string(),
        image: Some(avatar),
    };
    let record = cruds_user
        .post(form, None)
        .await
        .expect("could not create user");
    println!("Created user: {:?}", record);

    // Reading a record
    let options = UserOptions {
        process: Some(false),
        fields: Some(vec![
            UserSelectable::Id,
            UserSelectable::Name,
            UserSelectable::Places,
        ]),
    };
    let user = cruds_user
        .get_partial(record.id, Some(options))
        .await
        .expect("could not extract user");
    println!("Fetched user: {:?}", user)
}

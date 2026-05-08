use backend::{
    lib_::seaorm_::cruds::Read,
    models::{
        cruds::{CrudsUser, UserOptions},
        schemas::user::UserSelectableFields,
    },
    services::instances::AppState,
};

#[tokio::main]
async fn main() {
    let app_state = AppState::new().await;
    let cruds_user = CrudsUser::new(app_state);
    let options = UserOptions {
        process: Some(false),
        fields: Some(vec![
            UserSelectableFields::Id,
            UserSelectableFields::Name,
            UserSelectableFields::Places,
        ]),
    };
    let user = cruds_user
        .get_partial(1, Some(options))
        .await
        .expect("could not extract user");
    println!("{:?}", user)
}

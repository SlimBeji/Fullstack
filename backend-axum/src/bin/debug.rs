use backend::{
    lib_::seaorm_::cruds::Read, models::cruds::CrudsUser, services::instances::AppState,
};

#[tokio::main]
async fn main() {
    let app_state = AppState::new().await;
    let cruds_user = CrudsUser::new(app_state);
    let user = cruds_user.get(1).await.expect("could not extract user");
    println!("{:?}", user)
}

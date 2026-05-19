use crate::{models::schemas::user::UserSeed, static_::get_image_path};

pub fn get_user_seeds() -> Vec<UserSeed> {
    vec![
        UserSeed {
            ref_: 1,
            name: "Slim Beji".to_string(),
            email: "mslimbeji@gmail.com".to_string(),
            password: "very_secret".to_string(),
            image_url: get_image_path("avatar1.jpg"),
            is_admin: true,
        },
        UserSeed {
            ref_: 2,
            name: "Mohamed Slim Beji".to_string(),
            email: "beji.slim@yahoo.fr".to_string(),
            password: "very_secret".to_string(),
            image_url: get_image_path("avatar2.jpg"),
            is_admin: false,
        },
    ]
}

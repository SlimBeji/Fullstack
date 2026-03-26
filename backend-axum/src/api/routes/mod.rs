use utoipa_axum::router::OpenApiRouter;

use crate::services::SharedState;

mod auth;
mod hello_world;
mod places;
mod users;

pub fn create_router(prefix: &str) -> OpenApiRouter<SharedState> {
    OpenApiRouter::new()
        .nest(&format!("{}{}", prefix, auth::PATH), auth::routes())
        .nest(
            &format!("{}{}", prefix, hello_world::PATH),
            hello_world::routes(),
        )
        .nest(&format!("{}{}", prefix, users::PATH), users::routes())
        .nest(&format!("{}{}", prefix, places::PATH), places::routes())
}

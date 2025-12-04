use axum::{
    Json, Router,
    http::StatusCode,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;

#[cfg(test)]
mod tests;

#[tokio::main]
async fn main() {
    // initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::TRACE)
        .with_target(false)
        .init();

    // build router
    let app = Router::new()
        .route("/", get(root))
        .route("/users", post(create_user));

    let app = add_trace_layer(app);

    // serve the app
    let listener = TcpListener::bind("0.0.0.0:5003")
        .await
        .expect("Failed to bind listener");

    axum::serve(listener, app)
        .await
        .expect("Failed serve teh app");
}

fn add_trace_layer(router: Router) -> Router {
    router.layer(ServiceBuilder::new().layer(
        TraceLayer::new_for_http().make_span_with(
            |request: &axum::http::Request<_>| {
                tracing::info_span!(
                    "request",
                    method = %request.method(),
                    uri = %request.uri(),
                )
            },
        ),
    ))
}

async fn root() -> &'static str {
    "Hello, World!"
}

async fn create_user(
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<User>) {
    let user = User {
        id: 1337,
        username: payload.username,
    };
    (StatusCode::CREATED, Json(user))
}

#[derive(Deserialize)]
struct CreateUser {
    username: String,
}

#[derive(Serialize)]
struct User {
    id: u64,
    username: String,
}

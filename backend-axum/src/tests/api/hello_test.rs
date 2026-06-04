use crate::{
    models::cruds::CrudsUser,
    tests::api::utils::{get_content_type, parse_json, setup},
};
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::json;
use tower::ServiceExt;

#[tokio::test]
async fn test_hello_world() {
    let (app, _) = setup().await;

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/hello-world")
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let json = parse_json(response).await;
    assert_eq!(json, json!({"message": "Hello World!"}));
}

#[tokio::test]
async fn test_hello_user() {
    let (app, state) = setup().await;
    let cruds = CrudsUser::new(state);
    let token = cruds
        .get_bearer("mslimbeji@gmail.com")
        .await
        .expect("test error");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/hello-world/user")
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let json = parse_json(response).await;
    assert_eq!(json, json!({"message": "Hello Slim Beji!"}));
}

#[tokio::test]
async fn test_hello_admin() {
    let (app, state) = setup().await;
    let cruds = CrudsUser::new(state);
    let token = cruds
        .get_bearer("mslimbeji@gmail.com")
        .await
        .expect("test error");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/hello-world/admin")
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let json = parse_json(response).await;
    assert_eq!(json, json!({"message": "Hello Admin Slim Beji!"}));
}

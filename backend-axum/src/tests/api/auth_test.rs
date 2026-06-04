use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt;

use crate::static_;
use crate::tests::api::utils::{MultipartTestRequest, parse_json, setup};

#[tokio::test]
async fn test_signup() {
    let (app, _) = setup().await;

    let (content_type, body_bytes) = MultipartTestRequest::new()
        .add_field("name", "Didier Drogba")
        .add_field("email", "new_user@gmail.com")
        .add_field("password", "very_secret")
        .add_file("image", &static_::get_image_path("avatar1.jpg"))
        .build();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/signup")
                .header("Content-Type", content_type)
                .body(Body::from(body_bytes))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response
            .headers()
            .get("Content-Type")
            .expect("test error")
            .to_str()
            .expect("test error")
            .contains("application/json")
    );

    let json = parse_json(response).await;
    assert_eq!(json["email"], "new_user@gmail.com");
    assert!(json.get("user_id").is_some(), "missing user_id");
    assert!(json.get("access_token").is_some(), "missing access_token");
}

#[tokio::test]
async fn test_signin() {
    let (app, _) = setup().await;

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/signin")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(Body::from(
                    "username=mslimbeji@gmail.com&password=very_secret",
                ))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response
            .headers()
            .get("Content-Type")
            .expect("test error")
            .to_str()
            .expect("test error")
            .contains("application/json")
    );

    let json = parse_json(response).await;
    assert_eq!(json["email"], "mslimbeji@gmail.com");
    assert!(json.get("user_id").is_some(), "missing user_id");
    assert!(json.get("access_token").is_some(), "missing access_token");
}

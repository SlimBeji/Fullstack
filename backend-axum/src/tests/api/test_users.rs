use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::{Value, json};
use tower::ServiceExt;

use crate::{lib_::types_::PaginatedData, tests::api::utils::get_simple_user};
use crate::{models::schemas::UserRead, tests::api::utils::get_admin_user};
use crate::{
    static_,
    tests::api::utils::{MultipartTestRequest, get_content_type, parse_json, setup},
};

#[tokio::test]
async fn test_fetch_users() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/users/")
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let json: PaginatedData<Value> =
        serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(json.page, 1);
    assert_eq!(json.total_pages, 1);
    assert_eq!(json.total_count, 2);
    assert!(!json.data.is_empty(), "missing data");
}

#[tokio::test]
async fn test_query_users() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state).await;

    let payload = json!({
        "email": ["ilike:@gmail.com"],
        "fields": ["email", "name"]
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users/search")
                .header("Authorization", token)
                .header("Content-Type", "application/json")
                .body(Body::from(payload.to_string()))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let json: PaginatedData<Value> =
        serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(json.page, 1);
    assert_eq!(json.total_pages, 1);
    assert_eq!(json.total_count, 1);
    assert_eq!(json.data[0]["name"], "Slim Beji");
    assert_eq!(json.data[0]["email"], "mslimbeji@gmail.com");
}

#[tokio::test]
async fn test_create_user_as_admin() {
    let (app, state) = setup().await;
    let (_, token) = get_admin_user(state).await;

    let (content_type, body_bytes) = MultipartTestRequest::new()
        .add_field("name", "Test Van Test")
        .add_field("email", "test@test.com")
        .add_field("password", "very_secret")
        .add_field("is_admin", "true")
        .add_file("image", &static_::get_image_path("avatar1.jpg"))
        .build();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users/")
                .header("Authorization", token)
                .header("Content-Type", content_type)
                .body(Body::from(body_bytes))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let resp: UserRead = serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(resp.email, "test@test.com");
    assert_eq!(resp.name, "Test Van Test");
    assert!(resp.is_admin);
}

#[tokio::test]
async fn test_create_user_as_non_admin() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state).await;

    let (content_type, body_bytes) = MultipartTestRequest::new()
        .add_field("name", "Test Van Test II")
        .add_field("email", "test_2@test.com")
        .add_field("password", "very_secret")
        .add_field("is_admin", "true")
        .add_file("image", &static_::get_image_path("avatar1.jpg"))
        .build();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users/")
                .header("Authorization", token)
                .header("Content-Type", content_type)
                .body(Body::from(body_bytes))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_get_user_by_id() {
    let (app, state) = setup().await;
    let (user, token) = get_simple_user(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/users/{}", user.id))
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let resp: UserRead = serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(resp.email, "beji.slim@yahoo.fr");
    assert_eq!(resp.name, "Mohamed Slim Beji");
}

#[tokio::test]
async fn test_update_user() {
    let (app, state) = setup().await;
    let (user, token) = get_simple_user(state).await;

    let payload = json!({"name": "Slim El Beji"});

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri(format!("/api/users/{}", user.id))
                .header("Authorization", token)
                .header("Content-Type", "application/json")
                .body(Body::from(payload.to_string()))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let resp: UserRead = serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(resp.email, "beji.slim@yahoo.fr");
    assert_eq!(resp.name, "Slim El Beji");
}

#[tokio::test]
async fn test_update_other_users() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state.clone()).await;
    let (admin, _) = get_admin_user(state).await;

    let payload = json!({"name": "Slim El Beji"});

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri(format!("/api/users/{}", admin.id))
                .header("Authorization", token)
                .header("Content-Type", "application/json")
                .body(Body::from(payload.to_string()))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    assert!(get_content_type(&response).contains("application/json"));
}

#[tokio::test]
async fn test_delete_user_as_admin() {
    let (app, state) = setup().await;
    let (admin, token) = get_admin_user(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/users/{}", admin.id))
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let json = parse_json(response).await;
    assert_eq!(json["message"], format!("Deleted user {}", admin.id));
}

#[tokio::test]
async fn test_delete_user_as_non_admin() {
    let (app, state) = setup().await;
    let (user, token) = get_simple_user(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/users/{}", user.id))
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    assert!(get_content_type(&response).contains("application/json"));
}

use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::{Value, json};
use tower::ServiceExt;

use crate::lib_::{
    seaorm_::Search,
    types_::{PaginatedData, SearchQuery, where_str_eq},
};
use crate::models::{
    cruds::CrudsPlace,
    schemas::{PlaceRead, PlaceSearchable},
};
use crate::services::SharedState;
use crate::static_;
use crate::tests::api::utils::{
    MultipartTestRequest, get_admin_user, get_content_type, get_simple_user, parse_json, setup,
};

async fn get_place_examples(state: SharedState) -> Vec<PlaceRead> {
    let filters = where_str_eq(PlaceSearchable::Title, "Stamford Bridge");
    let query = SearchQuery {
        where_: Some(filters),
        ..Default::default()
    };
    CrudsPlace::new(state)
        .search(query, None)
        .await
        .expect("could not extract examples for testing places endpoints")
}

#[tokio::test]
async fn test_get_places() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/places/?title=eq:Stamford%20Bridge")
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
    assert_eq!(json.total_count, 1);
    assert!(!json.data.is_empty(), "missing data");
}

#[tokio::test]
async fn test_fetch_places() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state).await;

    let payload = json!({
        "title": ["Stamford Bridge"],
        "fields": ["address", "location"]
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/places/search")
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
    assert!(!json.data.is_empty(), "missing data");
    assert_eq!(json.data[0]["address"], "Fulham Road, London");
    assert_eq!(json.data[0]["location"]["lat"], 51.48180425016331_f64);
    assert_eq!(json.data[0]["location"]["lng"], -0.19090418688755467_f64);
}

#[tokio::test]
async fn test_create_place() {
    let (app, state) = setup().await;
    let (user, token) = get_simple_user(state).await;

    let (content_type, body_bytes) = MultipartTestRequest::new()
        .add_field("creator_id", &user.id.to_string())
        .add_field("description", "A brand new place")
        .add_field("title", "Brand New Place")
        .add_field("address", "Somewhere over the rainbow")
        .add_field("lat", "1.0")
        .add_field("lng", "2.0")
        .add_file("image", &static_::get_image_path("place1.jpg"))
        .build();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/places/")
                .header("Authorization", token)
                .header("Content-Type", content_type)
                .body(Body::from(body_bytes))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let resp: PlaceRead = serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(resp.creator_id, user.id);
    assert_eq!(resp.description, "A brand new place");
    assert_eq!(resp.title, "Brand New Place");
    assert_eq!(resp.address, "Somewhere over the rainbow");
}

#[tokio::test]
async fn test_create_place_for_others() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state.clone()).await;
    let (other_user, _) = get_admin_user(state).await;

    let (content_type, body_bytes) = MultipartTestRequest::new()
        .add_field("creator_id", &other_user.id.to_string())
        .add_field("description", "A brand new place")
        .add_field("title", "Brand New Place")
        .add_field("address", "Somewhere over the rainbow")
        .add_field("lat", "1.0")
        .add_field("lng", "2.0")
        .add_file("image", &static_::get_image_path("place1.jpg"))
        .build();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/places/")
                .header("Authorization", token)
                .header("Content-Type", content_type)
                .body(Body::from(body_bytes))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    assert!(get_content_type(&response).contains("application/json"));
}

#[tokio::test]
async fn test_get_place_by_id() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state.clone()).await;
    let examples = get_place_examples(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/places/{}", examples[0].id))
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let resp: PlaceRead = serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(resp.address, "Fulham Road, London");
    assert_eq!(resp.title, "Stamford Bridge");
    assert_eq!(resp.description, "Chelsea FC Stadium");
}

#[tokio::test]
async fn test_update_place_by_id() {
    let (app, state) = setup().await;
    let (_, token) = get_admin_user(state.clone()).await;
    let examples = get_place_examples(state).await;

    let payload = json!({"description": "Stamford Bridge - Home of the Blues"});

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri(format!("/api/places/{}", examples[0].id))
                .header("Authorization", token)
                .header("Content-Type", "application/json")
                .body(Body::from(payload.to_string()))
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let resp: PlaceRead = serde_json::from_value(parse_json(response).await).expect("test error");
    assert_eq!(resp.address, "Fulham Road, London");
    assert_eq!(resp.title, "Stamford Bridge");
    assert_eq!(resp.description, "Stamford Bridge - Home of the Blues");
}

#[tokio::test]
async fn test_update_place_for_others() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state.clone()).await;
    let examples = get_place_examples(state).await;

    let payload = json!({"description": "Stamford Bridge - Home of the Blues"});

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri(format!("/api/places/{}", examples[0].id))
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
async fn test_delete_place_for_others() {
    let (app, state) = setup().await;
    let (_, token) = get_simple_user(state.clone()).await;
    let examples = get_place_examples(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/places/{}", examples[0].id))
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    assert!(get_content_type(&response).contains("application/json"));
}

#[tokio::test]
async fn test_delete_place() {
    let (app, state) = setup().await;
    let (_, token) = get_admin_user(state.clone()).await;
    let examples = get_place_examples(state).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/places/{}", examples[0].id))
                .header("Authorization", token)
                .body(Body::empty())
                .expect("test error"),
        )
        .await
        .expect("test error");

    assert_eq!(response.status(), StatusCode::OK);
    assert!(get_content_type(&response).contains("application/json"));

    let json = parse_json(response).await;
    assert_eq!(json["message"], format!("Deleted place {}", examples[0].id));
}

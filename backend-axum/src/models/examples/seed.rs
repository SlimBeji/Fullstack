use std::{collections::HashMap, sync::Arc};

use tokio::task::JoinSet;

use crate::{
    config,
    lib_::{seaorm_::Create, types_::FileToUpload, utils},
    models::{
        cruds::{CrudsPlace, CrudsUser},
        examples::{place::get_place_seeds, user::get_user_seeds},
        orm::{PLACE_MODEL, USER_MODEL, get_tables},
        schemas::{PlacePost, UserPost},
    },
    services::instances::AppState,
};

type RecordMap = HashMap<u32, u32>;
type RecordsMap = HashMap<String, RecordMap>;

async fn seed_users(state: Arc<AppState>, refs: &mut RecordsMap) -> Result<(), String> {
    let cruds = CrudsUser::new(state);
    let mut join_set = JoinSet::new();

    for user in get_user_seeds() {
        let cruds = cruds.clone();
        join_set.spawn(async move {
            // Step 1: hash password
            let hashed = utils::hash_input(&user.password, config::ENV.default_hash_salt as u32)
                .expect("failed to hash a password");

            // Step 2: create the post form
            let post_form = UserPost {
                name: user.name.clone(),
                email: user.email.clone(),
                is_admin: user.is_admin,
                password: hashed,
                image: Some(
                    FileToUpload::from_path(&user.image_url)
                        .expect("failed to load an image file for user record"),
                ),
            };

            // Step 3: convert the Post to Create (handle image upload)
            let data = cruds
                .post_to_create(post_form)
                .await
                .expect("failed to build creation form for user record");

            // Step 4: create the record
            let id = cruds
                .create(data)
                .await
                .expect("failed to create a user record");
            (user.ref_, id)
        });
    }

    let mut map = HashMap::new();
    while let Some(result) = join_set.join_next().await {
        match result {
            Ok((ref_, id)) => {
                map.insert(ref_, id);
            }
            Err(e) => return Err(format!("Task panicked: {:?}", e)),
        }
    }
    refs.insert(USER_MODEL.to_string(), map);
    Ok(())
}

async fn seed_places(state: Arc<AppState>, refs: &mut RecordsMap) -> Result<(), String> {
    let cruds = CrudsPlace::new(state);
    let mut join_set = JoinSet::new();
    let users_map = Arc::new(
        refs.get(USER_MODEL)
            .expect("failed to extract the users id mapping")
            .clone(),
    );

    for place in get_place_seeds() {
        let cruds = cruds.clone();
        let users_map = users_map.clone();
        join_set.spawn(async move {
            // Step 1: get the corresponding creator_id
            let creator_id = users_map
                .get(&place.creator_ref)
                .expect("failed to extract a user from a place creator_ref");

            // Step 2: create the post form
            let post_form = PlacePost {
                creator_id: *creator_id,
                title: place.title.clone(),
                description: place.description.clone(),
                address: place.address.clone(),
                lat: place.location.lat,
                lng: place.location.lng,
                image: Some(
                    FileToUpload::from_path(&place.image_url)
                        .expect("failed to load an image file for place record"),
                ),
            };

            // Step 3: convert the Post to Create (handle image upload)
            let data = cruds
                .post_to_create(post_form)
                .await
                .expect("failed to build creation form for place record");

            // Step 4: create the record
            let id = cruds
                .seed(data, place.embedding)
                .await
                .expect("failed to create a place record");

            (place.ref_, id)
        });
    }

    let mut map = HashMap::new();
    while let Some(result) = join_set.join_next().await {
        match result {
            Ok((ref_, id)) => {
                map.insert(ref_, id);
            }
            Err(e) => return Err(format!("Task panicked: {:?}", e)),
        }
    }
    refs.insert(PLACE_MODEL.to_string(), map);
    Ok(())
}

pub async fn seed_db(verbose: bool) {
    let app_state = Arc::new(AppState::new().await);
    let mut refs: RecordsMap = HashMap::new();

    // Users
    seed_users(app_state.clone(), &mut refs)
        .await
        .expect("failed at seeding user records");
    if verbose {
        println!("✅ Users data seeded!");
    }

    // Places
    seed_places(app_state.clone(), &mut refs)
        .await
        .expect("failed at seeding place records");
    if verbose {
        println!("✅ Places data seeded!");
    }

    if verbose {
        println!("✅ Finished. You may exit");
    }
}

pub async fn dumb_db(verbose: bool) {
    let app_state = AppState::new().await;
    for tablename in get_tables() {
        let result = app_state.pg.reset_table(tablename).await;
        match result {
            Ok(_) => {
                if verbose {
                    println!("✅ Table {} cleared!", tablename);
                }
            }
            Err(err) => {
                if verbose {
                    println!("Could not reset table {}", tablename);
                    println!("{:?}", err);
                }
                return;
            }
        }

        if result.is_err() && verbose {}
    }

    let result = app_state.redis.flush_all().await;
    match result {
        Ok(_) => {
            if verbose {
                println!("✅ Cache DB flushed");
                println!("✅ Finished. You may exit");
            }
        }
        Err(err) => {
            if verbose {
                println!("Failed to flush redis db");
                println!("{:?}", err);
            }
        }
    }
}

# 🚀 Axum Backend

This backend is written in **Rust** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                              |
| --------------- | ------------------------------------------------------------------------- |
| HTTP Server     | [axum](https://github.com/tokio-rs/axum)                                  |
| Database ORM    | [mongo-rust-driver](https://github.com/mongodb/mongo-rust-driver)         |
| Data Validation | [validator](https://github.com/Keats/validator)                           |
| OpenAPI Docs    | [utoipa](https://github.com/juhaku/utoipa)                                |
| Background Jobs | [apalis](https://github.com/apalis-dev/apalis)                            |
| Task Scheduling | [tokio-cron-scheduler](https://github.com/mvniekerk/tokio-cron-scheduler) |

## 🔐 Environment Variables

The Axum backend relies on a `axum.env` file for configuration.

```
# ENV
PORT=5003
API_URL=http://localhost:5003/api
APP_URL=*
SECRET_KEY=NOT_VERY_SECRET
DEFAULT_HASH_SALT=12
FILEUPLOAD_MAX_SIZE=100
JSON_MAX_SIZE=10240
MAX_ITEMS_PER_PAGE=100
GOD_MODE_LOGIN=very_secret
JWT_EXPIRATION=3600
DEFAULT_TIMEOUT=30
ENV=dev

# DATABASE
MONGO_URL=mongodb://mongo1:27017,mongo2:27017/myapp?replicaSet=rs0
MONGO_DBNAME=myapp
MONGO_TEST_DBNAME=tests
REDIS_URL=redis://redis:6379/0
REDIS_TEST_URL=redis://redis:6379/1
REDIS_DEFAULT_EXPIRATION=3600

# HUGGING FACE
HF_API_TOKEN=<YOUR_API_TOKEN_HERE>

# GCP
GOOGLE_APPLICATION_CREDENTIALS=
GCP_PROJECT_ID=dev-project
GCS_BUCKET_NAME=dev-bucket
GCS_EMULATOR_PRIVATE_URL=http://gcs:4443
GCS_EMULATOR_PUBLIC_URL=http://localhost:4443
GCS_BLOB_ACCESS_EXPIRATION=3600
```

## 🧹 Linting

The official rust `rustfmt` package is used for code formatting. No additional utility for linting. The parameters are set in a **rustfmt.toml** file.

## 📁 Key Directories

-   `config/` – Environment variables and global parameters setup
-   `models/` – Data modeling: schemas, collections, CRUD logic, and example seed data
-   `api/` – Axum server setup: auth, middlewares, swagger config and REST routes
-   `types/` – Shared types and data contracts.
-   `lib/` – Core business logic, utility functions, and third-party service clients
-   `worker/` – Background processing (e.g., tasks and scheduled crons)
-   `tests/` – Unit tests.
-   `bin/` – CLI scripts (e.g., migrations, debugging utilities, seeding and dumping developement database ...)
-   `static/` – Static assets (e.g., images, public files)

> The idiomatic way in **Rust** is to have the `/tests` folder next to the `/src` folder but for the sake of consistency with the other backends, the `/tests` folder was placed inside the `/src` folder.

> `/bin` was prefered to `/scripts` (like in the other backend projects) because of the native cargo support for running: `cargo run --bin script_name`.

## 🛠️ Makefile Commands

The following `make` commands help manage the Axum backend:

| Command                   | Description                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| `make axum-build`         | Build the Docker container for the Axum service.                      |
| `make axum-bash`          | Open an interactive shell inside the running Axum container.          |
| `make axum-test`          | Run unit tests                                                        |
| `make axum-lint`          | Run cargo fmt + cargo check to make sure format + compilation is good |
| `make axum-script/⟨name⟩` | Execute a binary from `bin/` directory                                |
| `make axum-debug`         | Run `debug.rs` inside /bin. Used to debug in development              |
| `make axum-seed`          | Run `seed.rs` inside /bin. Used to seed the DB in development         |
| `make axum-dump`          | Run `dump.rs` inside /bin. Used to dump the DB in development         |

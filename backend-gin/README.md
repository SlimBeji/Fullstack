# 🚀 Gin Backend

This backend is written in **Go** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                          |
| --------------- | --------------------------------------------------------------------- |
| HTTP Server     | [gin](https://github.com/gin-gonic/gin)                               |
| Database ORM    | [mongo-go-driver](https://github.com/mongodb/mongo-go-driver)         |
| Data Validation | [go-playground/validator](https://github.com/go-playground/validator) |
| OpenAPI Docs    | [gin-swagger](github.com/swaggo/gin-swagger)                          |
| Background Jobs | [async](https://github.com/hibiken/asynq)                             |
| Task Scheduling | [gocron](https://github.com/go-co-op/gocron)                          |

## 🔐 Environment Variables

The Gin backend relies on a `gin.env` file for configuration.

```
# ENV
PORT=5001
API_URL=http://localhost:5002/api
APP_URL=*
SECRET_KEY=NOT_VERY_SECRET
FILEUPLOAD_MAX_SIZE=100
JSON_MAX_SIZE=10240
MAX_ITEMS_PER_PAGE=100
GOD_MODE_LOGIN=very_secret
JWT_EXPIRATION=3600
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

The official go `fmt` package is used for code formatting. No additional utility for linting.

## 📁 Key Directories

-   `models/` – Data modeling: schemas, collections, CRUD logic, and example seed data
-   `api/` – Gin server setup: auth, middlewares and REST routes
-   `types/` – Shared types and data contracts.
-   `lib/` – Core business logic, utility functions, and third-party service clients
-   `worker/` – Background processing (e.g., tasks and scheduled crons)
-   `tests/` – Unit tests
-   `scripts/` – One-off scripts (e.g., migrations, debugging utilities)
-   `static/` – Static assets (e.g., images, public files)

## 🛠️ Makefile Commands

The following `make` commands help manage the Gin backend:

| Command                  | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| `make gin-build`         | Build the Docker container for the Gin service.                              |
| `make gin-bash`          | Open an interactive shell inside the running Gin container.                  |
| `make gin-test`          | Run unit tests using.                                                        |
| `make gin-lint`          | Run go fmt for code formatting                                               |
| `make gin-script/⟨name⟩` | Execute a script from `scripts/` directory (e.g. `make fastapi-script/foo`). |
| `make gin-debug`         | Run `debug.go` for debugging or manual testing.                              |
| `make gin-seed`          | Run `seed_db.go` to populate the database with seed data.                    |
| `make gin-dump`          | Run `dump_db.go` to export the database contents.                            |

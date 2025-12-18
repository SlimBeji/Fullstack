# 🚀 Gin Backend

This backend is written in **Go** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                          |
| --------------- | --------------------------------------------------------------------- |
| HTTP Server     | [gin](https://github.com/gin-gonic/gin)                               |
| Database ORM    | [mongo-go-driver](https://github.com/mongodb/mongo-go-driver)         |
| Data Validation | [go-playground/validator](https://github.com/go-playground/validator) |
| OpenAPI Docs    | [gin-swagger](github.com/swaggo/gin-swagger)                          |
| Background Jobs | [asynq](https://github.com/hibiken/asynq)                             |
| Task Scheduling | [gocron](https://github.com/go-co-op/gocron)                          |

## 🔐 Environment Variables

The Gin backend relies on a `gin.env` file for configuration.

```
# ENV
PORT=5002
API_URL=http://localhost:5002/api
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

The official go `fmt` package is used for code formatting. No additional utility for linting.

## 📁 Key Directories

The root directory contains the following key directories and files:

-   `internal/` – Contains the main application source code, following the structure defined in the root **README.md**.
-   `cmd/` – Contains entrypoints for running scripts.
-   `app.go` – The API server entrypoint.

> For a better development experience, hot reload is enabled in development using [air](https://github.com/air-verse/air). However, **air** does not work well if the entrypoint is placed in the `cmd/` folder. For this reason, the API server entrypoint (`app.go`) is kept separate from other `cmd` entries.

## 🛠️ Makefile Commands

The following `make` commands help manage the Gin backend:

| Command                  | Description                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `make gin-build`         | Build the Docker container for the Gin service.                                           |
| `make gin-bash`          | Open an interactive shell inside the running Gin container.                               |
| `make gin-test`          | Run unit tests                                                                            |
| `make gin-swagger`       | Run go swag init command and generate OpenAPI specifiications for Swagger UI              |
| `make gin-generate`      | Run go generate ./... for metaprogramming                                                 |
| `make gin-lint`          | Run go generate + swag init + go fmt + go build to make sure format + compilation is good |
| `make gin-script/⟨name⟩` | Execute a script from `scripts/` directory (e.g. `make fastapi-script/foo`).              |
| `make gin-debug`         | Run `debug.go` for debugging or manual testing.                                           |
| `make gin-seed`          | Run `seed_db.go` to populate the database with seed data.                                 |
| `make gin-dump`          | Run `dump_db.go` to export the database contents.                                         |

## 📌 Notes

### Metaprogramming

Go is a statically typed language and lacks advanced metaprogramming features like Rust’s macros. Writing HTTP schemas for an API backend can therefore become verbose, especially due to the repetitive definition of validation rules and metadata (e.g., Swagger documentation) for each field.

A single model field is often reused across multiple schemas (e.g., **read**, **create**, **update**), and redefining its metadata each time quickly becomes cumbersome.

To address this, all field metadata are defined once in YAML files under `/models/fields`. Using **AST parsing** and the **`go generate`** utility, raw schema definitions are automatically transformed into fully annotated schemas, eliminating metadata repetition.

The AST parsing logic is implemented in `/internal/models/raw/astparser`.

### CRUD

Unlike the **FastAPI** and **Express** backends, the `models/collections` and `models/crud` packages are structured differently.

**Go** does not support traditional object-oriented programming like **Python** or **TypeScript**, and it also lacks advanced trait-like abstractions with reusable behavior (as found in **Rust**). Go interfaces define only method signatures, without shared implementations, which makes certain forms of code abstraction more difficult.

For this reason, a slightly different approach was taken.

The `models/crud` folder contains five files—`create.go`, `read.go`, `fetch.go`, `update.go`, and `delete.go`.  
Each file defines an interface that a **collection struct** must implement to support the corresponding CRUD operation.

The `models/collections` folder provides the concrete implementations of these interfaces, along with additional helper methods specific to each model.

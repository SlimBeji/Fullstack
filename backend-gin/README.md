# 🚀 Gin Backend

This backend is written in **Go** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                          |
| --------------- | --------------------------------------------------------------------- |
| HTTP Server     | [gin](https://github.com/gin-gonic/gin)                               |
| ORM             | [Gorm](https://gorm.io/)                                              |
| Migrations      | [Atlas](https://atlasgo.io/)                                          |
| Data Validation | [go-playground/validator](https://github.com/go-playground/validator) |
| OpenAPI Docs    | [gin-swagger](https://github.com/swaggo/gin-swagger)                  |
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
DATABASE_URL=postgresql://dev:dev@pgsql:5432/dev
DATABASE_TEST_URL=postgresql://test:test@test-pgsql:5432/test
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

- `internal/` – Contains the main application source code, following the structure defined in the root **README.md**.
- `cmd/` – Contains entrypoints for running scripts.
- `app.go` – The API server entrypoint.

> For a better development experience, hot reload is enabled in development using [air](https://github.com/air-verse/air). However, **air** does not work well if the entrypoint is placed in the `cmd/` folder. For this reason, the API server entrypoint (`app.go`) is kept separate from other `cmd` entries.

## 🛠️ Makefile Commands

The following `make` commands help manage the Gin backend:

| Command                  | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `make gin-build`         | Build the Docker container for the Gin service.                                         |
| `make gin-bash`          | Open an interactive shell inside the running Gin container.                             |
| `make gin-atlas`         | Setup Atlas clean Dev DB.                                                               |
| `make gin-diff/⟨name⟩`   | Generate a new sql migration file (e.g. `make gin-diff/add_users`).                     |
| `make gin-migrate`       | Apply pending migrations to both dev and test databases.                                |
| `make gin-revert`        | Rollback the last migration on both dev and test databases.                             |
| `make gin-test`          | Run unit tests                                                                          |
| `make gin-swagger`       | Run go swag init command and generate OpenAPI specifiications for Swagger UI            |
| `make gin-lint`          | Run go swag init + go fmt + go vet + go build to make sure format + compilation is good |
| `make gin-script/⟨name⟩` | Execute a script from `scripts/` directory (e.g. `make fastapi-script/foo`).            |
| `make gin-debug`         | Run `debug.go` for debugging or manual testing.                                         |
| `make gin-seed`          | Run `seed_db.go` to populate the database with seed data.                               |
| `make gin-dump`          | Run `dump_db.go` to export the database contents.                                       |

## 📌 Notes

- Swagger documentation is generated using `gin-swagger`. The command `gin-lint` runs under the hood `go swag init` to refresh tge OpenAPI and Swagger files.

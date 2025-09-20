# 🚀 FastAPI Backend

This backend is written in **Python** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                                             |
| --------------- | ---------------------------------------------------------------------------------------- |
| HTTP Server     | [FastAPI](https://fastapi.tiangolo.com/)                                                 |
| Database ORM    | [Beanie](https://github.com/roman-right/beanie) + [Motor](https://motor.readthedocs.io/) |
| Data Validation | [Pydantic](https://docs.pydantic.dev/)                                                   |
| OpenAPI Docs    | \*Built-in via FastAPI                                                                   |
| Background Jobs | [Dramatiq](https://dramatiq.io/)                                                         |
| Task Scheduling | [apscheduler](https://apscheduler.readthedocs.io/en/3.x/index.html)                      |

## 🔐 Environment Variables

The FastAPI backend relies on a `fastapi.env` file for configuration.

```
# PYTHON
PYTHONPATH=/app

# ENV
PORT=5001
API_URL=http://localhost:5001/api
APP_URL=*
SECRET_KEY=NOT_VERY_SECRET
FILEUPLOAD_MAX_SIZE=100
JSON_MAX_SIZE=10mb
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
GOOGLE_APPLICATION_CREDENTIALS=<LEAVE_EMULATOR_FIELDS_EMPTY_IF_USING_REAL_GCS>
GCP_PROJECT_ID=dev-project
GCS_BUCKET_NAME=dev-bucket
GCS_EMULATOR_PRIVATE_URL=http://gcs:4443
GCS_EMULATOR_PUBLIC_URL=http://localhost:4443
GCS_BLOB_ACCESS_EXPIRATION=3600
```

## 🧹 Linting

This backend uses the following tools to ensure clean and consistent Python code:

-   **[mypy](https://mypy-lang.org/):** Static type checker for Python. It analyzes type hints and ensures functions, variables, and class attributes follow the expected types.  
    This is especially useful in larger codebases and when using tools like **Pydantic** or **FastAPI** where typing is essential.
-   **[autoflake](https://pypi.org/project/autoflake/):** Removes unused imports and variables.
-   **[isort](https://pycqa.github.io/isort/):** Automatically sorts imports.  
    Configured to work with `black` formatting (see `.isort.cfg`).
-   **[black](https://black.readthedocs.io/):** Opinionated code formatter for Python.

## 🔠 Casing

In Python, the standard for variables and fields is **snake_case** (e.g., `creator_id`).  
However, since all backends are designed to be interchangeable, **camelCase** will be used for JSON responses (e.g., `creatorId`) to maintain consistency across different backends.

## 📁 Key Directories

-   `models/` – Data modeling: schemas, collections, CRUD logic, and example seed data
-   `api/` – FastAPI server setup: auth, middlewares, OpenAPI Swagger metadata, and REST routes
-   `types_/` – Shared types, enums, annotations and data contracts. An underscore was added as suffix to avoid conflicts with the `types` package used by the `enum` module
-   `lib/` – Core business logic, utility functions, and third-party service clients
-   `worker/` – Background processing (e.g., tasks and scheduled crons)
-   `tests/` – Unit tests
-   `scripts/` – One-off scripts (e.g., migrations, debugging utilities)
-   `static/` – Static assets (e.g., images, public files)

## 🛠️ Makefile Commands

The following `make` commands help manage the FastAPI backend:

| Command                      | Description                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `make fastapi-build`         | Build the Docker container for the FastAPI service.                             |
| `make fastapi-bash`          | Open an interactive shell inside the running FastAPI container.                 |
| `make fastapi-test`          | Run unit tests using `pytest`.                                                  |
| `make fastapi-lint`          | Run all linting tools: `autoflake`, `isort`, `black`, and `mypy`.               |
| `make fastapi-script/⟨name⟩` | Execute a script from `scripts/` directory (e.g. `make fastapi-script/foo.py`). |
| `make fastapi-debug`         | Run `debug.py` for debugging or manual testing.                                 |
| `make fastapi-seed`          | Run `seed_db.py` to populate the database with seed data.                       |
| `make fastapi-dump`          | Run `dump_db.py` to export the database contents.                               |

## 📌 Notes

All tools were selected to be **compatible with Python's async ecosystem**, taking full advantage of **FastAPI’s ASGI architecture**. This ensures better scalability and performance by allowing concurrent processing of I/O-bound operations like DB access, API calls, and background jobs.

-   **Beanie + Motor** were chosen for interacting with MongoDB in an async-friendly manner.
-   **Dramatiq** handles background jobs and scheduled tasks. It integrates well with async workflows and message brokers like Redis or RabbitMQ.
-   **FastAPI** automatically generates Swagger and ReDoc documentation from Pydantic models and endpoint definitions.

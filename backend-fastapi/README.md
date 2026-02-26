# 🚀 FastAPI Backend

This backend is written in **Python** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                        |
| --------------- | ------------------------------------------------------------------- |
| HTTP Server     | [FastAPI](https://fastapi.tiangolo.com/)                            |
| ORM             | [SQLAlchemy](https://www.sqlalchemy.org/)                           |
| Migrations      | [Alembic](https://alembic.sqlalchemy.org/en/latest/)                |
| Data Validation | [Pydantic](https://docs.pydantic.dev/)                              |
| OpenAPI Docs    | \*Built-in via FastAPI                                              |
| Background Jobs | [Dramatiq](https://dramatiq.io/)                                    |
| Task Scheduling | [apscheduler](https://apscheduler.readthedocs.io/en/3.x/index.html) |

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
DEFAULT_HASH_SALT=12
FILEUPLOAD_MAX_SIZE=100
JSON_MAX_SIZE=10mb
MAX_ITEMS_PER_PAGE=100
GOD_MODE_LOGIN=very_secret
JWT_EXPIRATION=3600
DEFAULT_TIMEOUT=20
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
GOOGLE_APPLICATION_CREDENTIALS=<LEAVE_EMULATOR_FIELDS_EMPTY_IF_USING_REAL_GCS>
GCP_PROJECT_ID=dev-project
GCS_BUCKET_NAME=dev-bucket
GCS_EMULATOR_PRIVATE_URL=http://gcs:4443
GCS_EMULATOR_PUBLIC_URL=http://localhost:4443
GCS_BLOB_ACCESS_EXPIRATION=3600
```

## 🧹 Linting

This backend uses the following tools to ensure clean and consistent Python code:

- **[mypy](https://mypy-lang.org/):** Static type checker for Python. It analyzes type hints and ensures functions, variables, and class attributes follow the expected types.
  This is especially useful in larger codebases and when using tools like **Pydantic** or **FastAPI** where typing is essential.
- **[autoflake](https://pypi.org/project/autoflake/):** Removes unused imports and variables.
- **[isort](https://pycqa.github.io/isort/):** Automatically sorts imports.
  Configured to work with `black` formatting (see `.isort.cfg`).
- **[black](https://black.readthedocs.io/):** Opinionated code formatter for Python.

## 🔠 Casing

In Python, the standard for variables and fields is **snake_case** (e.g., `creator_id`).
However, since all backends are designed to be interchangeable, **camelCase** will be used for JSON responses (e.g., `creatorId`) to maintain consistency across different backends.

## 🛠️ Makefile Commands

The following `make` commands help manage the FastAPI backend:

| Command                      | Description                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `make fastapi-build`         | Build the Docker container for the FastAPI service.                             |
| `make fastapi-bash`          | Open an interactive shell inside the running FastAPI container.                 |
| `make fastapi-alembic`       | Initialize the alembic configuration.                                           |
| `make fastapi-diff/⟨name⟩`   | Generate a new Alembic migration (e.g. `make fastapi-diff/add_users`).          |
| `make fastapi-migrate`       | Apply pending migrations to both dev and test databases.                        |
| `make fastapi-revert`        | Rollback the last migration on both dev and test databases.                     |
| `make fastapi-test`          | Run unit tests using `pytest`.                                                  |
| `make fastapi-lint`          | Run all linting tools: `autoflake`, `isort`, `black`, and `mypy`.               |
| `make fastapi-script/⟨name⟩` | Execute a script from `scripts/` directory (e.g. `make fastapi-script/foo.py`). |
| `make fastapi-debug`         | Run `debug.py` for debugging or manual testing.                                 |
| `make fastapi-seed`          | Run `seed_db.py` to populate the database with seed data.                       |
| `make fastapi-dump`          | Run `dump_db.py` to export the database contents.                               |

## 📌 Notes

All tools were selected to be **compatible with Python's async ecosystem**, taking full advantage of **FastAPI's ASGI architecture**. This ensures better scalability and performance by allowing concurrent processing of I/O-bound operations like DB access, API calls, and background jobs.

- **SQLAlchemy (async) + asyncpg** were chosen for interacting with PostgreSQL in an async-friendly manner, providing robust ORM capabilities with full async/await support.
- **Dramatiq** handles background jobs and scheduled tasks. It integrates well with async workflows and message brokers like Redis or RabbitMQ.
- The python backend is run with `honcho` so that the backend, scheduler and worker are all run inside the same container using a `Procfile`

```
web: uvicorn api.app:create_app --factory --host 0.0.0.0 --port 5001 --reload
worker: watchmedo auto-restart --patterns="*.py" --recursive -- dramatiq background.handlers.handler
scheduler: watchmedo auto-restart --patterns="*.py" --recursive -- python -m background.crons.scheduler

```

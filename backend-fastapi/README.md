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
| Task Scheduling | [Dramatiq](https://dramatiq.io/)                                                         |

## 📁 Key Directories

-   `models/` – Data modeling: schemas, collections, CRUD logic, and example seed data
-   `api/` – FastAPI server setup: auth, middlewares, OpenAPI Swagger metadata, and REST routes
-   `types/` – Shared types, enums, annotations and data contracts
-   `lib/` – Core business logic, utility functions, and third-party service clients
-   `worker/` – Background processing (e.g., tasks and scheduled crons)
-   `tests/` – Unit tests
-   `scripts/` – One-off scripts (e.g., migrations, debugging utilities)
-   `static/` – Static assets (e.g., images, public files)

## 📌 Notes

All tools were selected to be **compatible with Python's async ecosystem**, taking full advantage of **FastAPI’s ASGI architecture**. This ensures better scalability and performance by allowing concurrent processing of I/O-bound operations like DB access, API calls, and background jobs.

-   **Beanie + Motor** were chosen for interacting with MongoDB in an async-friendly manner.
-   **Dramatiq** handles background jobs and scheduled tasks. It integrates well with async workflows and message brokers like Redis or RabbitMQ.
-   **FastAPI** automatically generates Swagger and ReDoc documentation from Pydantic models and endpoint definitions.

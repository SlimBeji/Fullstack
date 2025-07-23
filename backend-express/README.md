# 🚀 Express Backend

This backend is written in **TypeScript** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| HTTP Server     | [Express](https://expressjs.com/)                                                                                                          |
| Database ORM    | [Mongoose](https://mongoosejs.com/)                                                                                                        |
| Data Validation | [Zod](https://zod.dev/)                                                                                                                    |
| OpenAPI Docs    | [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi), [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) |
| Background Jobs | [BullMQ](https://docs.bullmq.io/)                                                                                                          |
| Task Scheduling | [node-cron](https://www.npmjs.com/package/node-cron)                                                                                       |

## 📁 Key Directories

-   `models/` – Data modeling: schemas, collections, CRUD logic, and example seed data
-   `api/` – Express server setup: auth, middlewares, OpenAPI docs, and REST routes
-   `types/` – Shared types, enums, interfaces, and module extensions (e.g., `express.d.ts`)
-   `lib/` – Core business logic, utility functions, and third-party service clients
-   `worker/` – Background processing (e.g., tasks and scheduled crons)
-   `tests/` – Unit tests
-   `scripts/` – One-off scripts (e.g., migrations, debugging utilities)
-   `static/` – Static assets (e.g., images, public files)

## 📌 Notes

-   Swagger documentation is auto-generated from Zod schemas using `zod-to-openapi` and served via `swagger-ui-express`.
-   Background jobs are processed via BullMQ with Redis as the broker.
-   Scheduled tasks (cron jobs) are powered by `node-cron`.

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

## 🧹 Linting

This app uses **[ESLint](https://eslint.org/)** and **[Prettier](https://prettier.io/)** to ensure consistent code quality and formatting.

### 🛠 ESLint

The configuration uses the modern `eslint.config.js` format and includes the following plugins:

- **[@typescript-eslint](https://typescript-eslint.io/):** TypeScript-specific linting rules.
- **[eslint-plugin-unused-imports](https://www.npmjs.com/package/eslint-plugin-unused-imports):**  
  Automatically detects and removes unused imports and variables.
- **[eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort):**  
  Enforces consistent ordering of imports and exports.

#### 🔑 Key ESLint Rules

- `no-unused-vars` and `no-undef`: **Disabled** (handled by TypeScript and `unused-imports`).
- `unused-imports/no-unused-vars`: **Warn**, ignores variables/args starting with `_`.
- `@typescript-eslint/no-explicit-any`: **Disabled** to allow use of `any` during development.
- `no-useless-escape`: **Disabled** to avoid messing with regular expressions.

### 🎨 Prettier

Prettier is used for formatting with the following config:

```json
{
    "tabWidth": 4,
    "trailingComma": "es5"
}
```

## 📁 Key Directories

- `models/` – Data modeling: schemas, collections, CRUD logic, and example seed data
- `api/` – Express server setup: auth, middlewares, OpenAPI docs, and REST routes
- `types/` – Shared types, enums, interfaces, and module extensions (e.g., `express.d.ts`)
- `lib/` – Core business logic, utility functions, and third-party service clients
- `worker/` – Background processing (e.g., tasks and scheduled crons)
- `tests/` – Unit tests
- `scripts/` – One-off scripts (e.g., migrations, debugging utilities)
- `static/` – Static assets (e.g., images, public files)

## 🛠️ Makefile Commands

The following shortcuts are available for managing the Express backend via `make`:

| Command                             | Description                                                           |
| ----------------------------------- | --------------------------------------------------------------------- |
| `make express-build`                | Build the Docker container for the Express app.                       |
| `make express-bash`                 | Open an interactive shell inside the running Express container.       |
| `make express-test`                 | Run the unit tests using the configured test runner.                  |
| `make express-lint`                 | Lint and auto-format the codebase using ESLint, Prettier, and TSC.    |
| `make express-script/⟨filename⟩.ts` | Execute a one-off script inside `src/scripts/`. Replace `⟨filename⟩`. |
| `make express-debug`                | Run `debug.ts` for debugging or manual testing.                       |
| `make express-seed`                 | Run `seedDb.ts` to populate the database with initial/sample data.    |
| `make express-dump`                 | Run `dumpDb.ts` to export the current database state to a file.       |

## 📌 Notes

- Swagger documentation is auto-generated from Zod schemas using `zod-to-openapi` and served via `swagger-ui-express`.
- Background jobs are processed via BullMQ with Redis as the broker.
- Scheduled tasks (cron jobs) are powered by `node-cron`.

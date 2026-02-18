# 🚀 Express Backend

This backend is written in **TypeScript** and follows the architecture and principles defined in the root `README.md`.

## 🛠️ Tech Stack

| Purpose         | Library Used                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| HTTP Server     | [Express](https://expressjs.com/)                                                                                                          |
| ORM             | [TypeORM](https://typeorm.io/)                                                                                                             |
| Migrations      | [TypeORM](https://typeorm.io/)                                                                                                             |
| Data Validation | [Zod](https://zod.dev/)                                                                                                                    |
| OpenAPI Docs    | [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi), [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) |
| Background Jobs | [BullMQ](https://docs.bullmq.io/)                                                                                                          |
| Task Scheduling | [node-cron](https://www.npmjs.com/package/node-cron)                                                                                       |

## 🔐 Environment Variables

The Express backend relies on a `express.env` file for configuration.

```
# ENV
PORT=5000
API_URL=http://localhost:5000/api
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

## 🛠️ Makefile Commands

The following shortcuts are available for managing the Express backend via `make` in the projectroot folder:

| Command                             | Description                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `make express-build`                | Build the Docker container and install npm dependencies.                           |
| `make express-bash`                 | Open an interactive shell inside the running Express container.                    |
| `make express-diff/⟨MigrationName⟩` | Generate a new migration file by comparing current entities with the database.     |
| `make express-migrate`              | Run pending migrations on both dev and test databases.                             |
| `make express-revert`               | Revert the last migration on both dev and test databases.                          |
| `make express-test`                 | Run the unit tests using the configured test runner.                               |
| `make express-lint`                 | Lint and auto-format the codebase using TypeScript compiler, ESLint, and Prettier. |
| `make express-script/⟨filename⟩`    | Execute a one-off script inside `src/bin/`. Replace `⟨filename⟩` (without .ts).    |
| `make express-debug`                | Run `debug.ts` for debugging or manual testing.                                    |
| `make express-seed`                 | Run `seedDb.ts` to populate the database with initial/sample data.                 |
| `make express-dump`                 | Run `dumpDb.ts` to export the current database state to a file.                    |

## 📌 Notes

- Swagger documentation is auto-generated from Zod schemas using `zod-to-openapi` and served via `swagger-ui-express`.

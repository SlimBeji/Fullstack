# 🔧 Multi-Stack Fullstack Project

This project is an exploration of modern fullstack development by building and comparing interchangeable backend APIs and frontend SPAs using different technologies.

## 💡 Project Overview

The core idea is to **replicate the same REST API and frontend application** across multiple tech stacks and make them **fully interchangeable**.

All backends expose **identical endpoints**, and all frontends consume the same APIs, enabling any frontend to work with any backend without modification.

This setup allows for:

- Comparing **developer experience** across different tech stacks
- Identifying a solid and abstracted **code structure** for building REST APIs
- Experimenting with new technologies in a real-world scenario
- Understanding how to build scalable, interchangeable services

## 🐳 Dockerized Setup

Each application (frontend/backend) is **containerized using Docker** and organized in its own dedicated folder:

- Backend apps: `/backend-express`, `/backend-fastapi`, `/backend-gin`, `/backend-axum`
- Frontend apps: `/frontend-react`, `/frontend-vue`, `/frontend-svelte`, `/frontend-angular`

The `backend-` and `frontend-` prefixes group related applications together for easier navigation.

### 🔗 Shared Services

The `docker-compose.yaml` file orchestrates the following shared services:

- **PostgreSQL**: Primary relational database
- **pgAdmin**: Web-based PostgreSQL administration interface
- **Redis**: In-memory data store for caching and message brokering
- **RedisInsight**: Web UI for monitoring and managing Redis
- **Fake GCS Server**: Local emulator for Google Cloud Storage ([`fsouza/fake-gcs-server`](https://github.com/fsouza/fake-gcs-server))

## 🧱 Technology Stack

### 🗄️ Database: PostgreSQL

This project uses **PostgreSQL** as its primary database. While earlier iterations explored MongoDB for its document-oriented model, the project has migrated to PostgreSQL for its industry-standard adoption, superior performance, and robust feature set

- **Industry Standard**: Widely adopted across enterprises, with extensive tooling, community support, and proven scalability
- **Superior Performance**: Optimized query execution with advanced indexing (B-tree, GiST, GIN) and query planning
- **JSONB Support**: Native support for semi-structured data with efficient indexing and querying of JSON documents
- **ACID Compliance**: Strong consistency guarantees and transaction support for reliable data integrity
- **Mature Ecosystem**: Rich extension ecosystem (PostGIS, pg_vector, TimescaleDB) and compatibility with all major ORMs
- **Cost-Effective Hosting**: More affordable hosting options compared to managed MongoDB services, with numerous providers offering competitive pricing

> PostgreSQL combines the flexibility needed for modern application development with the reliability and performance required for production systems.

### 🔙 Backends

Each backend implements the **same logic**, **routes**, and **data models**:

| Language   | Web Framework                            | API Address               |
| ---------- | ---------------------------------------- | ------------------------- |
| TypeScript | [Express](https://expressjs.com/)        | http://localhost:5000/api |
| Python     | [FastAPI](https://fastapi.tiangolo.com/) | http://localhost:5001/api |
| Go         | [Gin](https://gin-gonic.com/)            | http://localhost:5002/api |
| Rust       | [Axum](https://github.com/tokio-rs/axum) | http://localhost:5003/api |

Each backend connects to a shared set of services (e.g., PostgreSQL, Redis).

### 🖼️ Frontends

Each frontend is a modern **Single Page Application (SPA)** built using popular frameworks:

| Framework | Dev Server URL        | Env File Example |
| --------- | --------------------- | ---------------- |
| React     | http://localhost:8000 | `react.env`      |
| Vue       | http://localhost:8001 | `vue.env`        |
| Svelte    | http://localhost:8002 | `svelte.env`     |
| Angular   | _Not Implemented Yet_ | `angular.env`    |

All frontends communicate with any backend through the **same REST API**, enabling a **plug-and-play architecture**.

#### ✅ Switching Backend for a Frontend

To connect a frontend to a specific backend, update the corresponding `.env` file with the correct API URL.

For example, for **React**, update the `VITE_BACKEND_URL` in `react.env` like so:

```env
VITE_BACKEND_URL=http://localhost:5000/api   # Express API
```

or

```env
VITE_BACKEND_URL=http://localhost:5001/api   # FastAPI
```

## 📐 Backend Architecture

This demo project features two models: **Users** and **Places**. Users can create accounts and add their favorite places to their profiles, while other users can browse and view these places.

Defining a clear folder structure is essential for building scalable applications. Poor organization quickly leads to issues such as circular import errors and difficult maintenance.

Below is the folder structure used across **all backend implementations**, shown from bottom to top (import order), independent of the programming language or web framework

### 📁 Lib

Reusable and abstracted modules that serve as the **foundation layer** of the application. No imports from sibling modules are allowed, placing `/lib` at the bottom of the import order.

The `/lib` folder acts as the **glue layer** between the application logic and external dependencies — providing consistent interfaces for HTTP frameworks, data validation libraries, PostgreSQL ORMs, and third-party services.

- **/utils** – Generic helper functions independent of any framework (e.g., date/string formatting, file I/O, encryption, hashing)
- **/types** – Reusable type definitions shared across the project (e.g., pagination parameters, file upload schemas, error responses)
- **/clients** – Wrappers around external services and APIs (e.g., Redis, Google Cloud Storage, task queues, HuggingFace, third-party APIs)
- **/framework\_** – Abstraction layer over web frameworks to normalize routing, middleware, and request handling (e.g., `fastapi_`, `express_`, `gin_`, `axum_`)
- **/validation\_** – Abstraction layer over validation/serialization libraries to provide consistent schema definitions (e.g., `pydantic_`, `zod_`, `validator_ (go)`, `validator_ (Rust)`)
- **/orm\_** – Abstraction layer over ORMs to provide consistent database interaction patterns (e.g., `sqlalchemy_`, `typeorm_`, `gorm_`, `seaorm_`)

> **Note:** The underscore suffix (e.g., `express_`, `pydantic_`) distinguishes these abstraction layers from the underlying libraries they wrap.

### 📁 Config

Centralized configuration module for loading and managing **environment variables** and **global parameters**. The `/config` folder sits just above `/lib` in the import order.

This module may import utilities from `/lib` (e.g., for parsing, validating, or transforming environment variables) but does not import from any higher-level modules.

**Typical contents:**

- Database connection strings
- API keys and secrets
- Service URLs and ports
- Feature flags
- Application-wide constants

### 📁 Static

Stores **static assets** such as images or files that may be served by the backend or used for documentation or testing. It may also contain helper functions for loading these assets.

`/static` is considered near the bottom of the import order, just above `lib` and `config`.

### 📁 Services

Manages **application services** such as database connections, third-party APIs, caching layers, and message queues. These modules import clients from `/lib` and instantiate them with project-specific configurations using parameters from `/config`.

The `/services` folder is split into two submodules to prevent circular imports:

- **instances** – Contains instantiated service objects consumed throughout the application (e.g., database connections, Redis clients, task queue publishers, external API clients). Each instance should expose:
    - `start()` or `connect()` – Initialize the service connection
    - `close()` or `disconnect()` – Gracefully shutdown the service

- **setup** – Contains orchestration logic to manage the lifecycle of all service instances. This module:
    - Calls `start()`/`connect()` on all instances during application startup
    - Calls `close()`/`disconnect()` on all instances during application shutdown

> **Import order:** The **instances** submodule sits near the bottom (can be imported by models, routes, etc.), while **setup** sits at the top (only imported by the main entry point). This separation prevents circular dependencies where services need each other during initialization.

### 📁 Models

Contains the **data layer** — the core domain models and database interaction logic.

Well-designed data models are critical for:

- **Development** – Clear contracts between layers
- **Testing** – Reproducible test data and fixtures
- **Seeding** – Generating realistic dummy data
- **Consistency** – Identical behavior across all backend implementations

The `/models` folder is organized into subfolders that separate concerns by lifecycle stage:

#### 📁📁 Schemas

Schema definitions are organized by their **specific purpose in the application lifecycle** — from creation and storage to retrieval and querying.

Each model has its own schema file containing multiple schema types:

##### 🌱 Seed Schema

Used for **generating dummy data** during database seeding. May include reference fields (e.g. `_ref` or `_creator_ref`) to link records across tables.

##### ✍️ Creation Schema

Represents the **internal structure** of a new record before insertion. Typically excludes auto-generated fields like IDs, timestamps, or reverse relationships.

##### 📤 Post Schema

Defines the **API request body** for `HTTP POST` endpoints. May differ from the Create Schema when transformation is needed (e.g., accepting a file upload that becomes an `imageUrl` string in storage).

##### 📄 Read Schema

Used when **returning data to clients**. Excludes sensitive or internal fields (e.g., password hashes, internal IDs) for security.

##### 🔧 Update Schema

Describes **partial updates** to existing records. All fields are typically optional to allow flexible modifications.

##### 📥 Put Schema

Defines the **API request body** for `HTTP PUT` endpoints. May differ from the Update Schema when transformation is needed (e.g. raw image to imageUrl).

> **Note:** REST conventions suggest using `PATCH` for partial updates, but `PUT` is used here due to its wider adoption and familiarity.

##### 🔍 Search Schema

Defines the **complete search API structure**, combining filters, field selection, sorting, and pagination into a single schema.

**Components of the Search Schema:**

- **Filters** – Field-level filtering with operators (e.g., `age=gte:30`, `name=like:John`)
- **Fields** – Field projection to select which fields are returned
- **Sort** – Sorting order with direction prefix (e.g., `-age` for descending, `age` for ascending)
- **Pagination** – Page number and size parameters

**Type literals for validation:**

Each model defines type literals to enforce which operations are allowed:

- **Selectable fields** – Allowed fields in responses (e.g., `placeSelectableFields = ["id", "title", "address"]`)
- **Searchable fields** – Allowed fields for filtering (e.g., `placeSearchableFields = ["title", "creatorId"]`)
- **Sortable fields** – Allowed sort fields with directions (e.g., `placeSortableFields = ["createdAt", "-createdAt", "title", "-title"]`)

These literals provide type safety and runtime validation for the Search Schema.

##### 📃 Paginated Data Schema

Wraps search results with **pagination metadata**: `total_count`, `page`, `total_pages`, and the `data` array.

#### 📁📁 ORM

The `/orm` folder contains the **implementation of each model** using the chosen ORM (SQLAlchemy, TypeORM, GORM, or SeaORM).

ORMs are preferred over raw SQL queries because they offer:

- **Type safety** – Catch errors at compile/transpile time, or via static analysis tools (e.g., MyPy for Python)
- **Easier refactoring** – Rename fields once, changes propagate everywhere
- **Cross-dialect compatibility** – Same code works across PostgreSQL versions

#### 📁📁 Migrations

The `/migrations` folder contains **database migration files** that track and apply schema changes over time.

Each migration file:

- Creates or alters tables based on ORM definitions
- Adds/removes columns, indexes, and constraints
- Ensures database schema stays in sync with code
- Provides rollback capability for reverting changes

Migration workflows vary by stack:

- **TypeScript/Express** – TypeORM handles both ORM and migrations
- **Python/FastAPI** – Alembic manages migrations for SQLAlchemy
- **Go/Gin** – Atlas (provides TypeORM/Alembic-like declarative migrations for GORM)
- **Rust/Axum** – sea-orm-migration (official SeaORM migration tool via `sea-orm-cli`)

#### 📁📁 CRUDS

For each model, a corresponding **CRUDS class** is created to encapsulate all **Create, Read, Update, Delete, and Search** operations.

**CRUDS** stands for:

- **C** → Create
- **R** → Read
- **U** → Update
- **D** → Delete
- **S** → Search

> **Why the extra "S"?** Traditional CRUD's "Read" typically covers simple ID-based retrieval. The added **"S" for Search** represents a sophisticated query API that combines filtering, sorting, field selection, and pagination—distinguishing `get(id)` from complex `search(query)` operations.

CRUDS operations are organized into **four layers**:

1. **Core methods** (e.g. `create`, `read`, `update`, `delete`, `search`) – Direct database operations using the ORM
2. **HTTP methods** (`post`, `get`, `put`, `delete`, `paginate`) – Methods exposed via HTTP endpoints (`delete` stays the same as the core method)
3. **Authorization hooks** (`authPost`, `authGet`, `authPut`, `authDelete`) – Validate user permissions and throw 401/403 errors when unauthorized (The search API uses the same `authGet` as the GET API)
4. **User methods** (`userPost`, `userGet`, `userPut`, `userDelete`, `userPaginate`) – Combine authorization + HTTP methods for authenticated endpoints. The **user method** calls its corresponding **auth method** for validation, then executes the **core/HTTP method** to perform the actual operation.

#### 📁📁 Examples

This folder contains **example records** for each model, along with utility methods to **seed and dump the database** for testing and development.

Each example is structured using the `SeedSchema` defined in the `schemas/` folder, which may include reference placeholders (e.g., `_creatorRef`) that get resolved to actual IDs during the seeding process.

**Typical contents:**

- Sample data fixtures for each model
- Seeding scripts to populate the database
- Dump utilities to export data for backup or migration

### 📁 Core

In a full-featured application, the `/core` layer contains **business logic** that orchestrates data operations to deliver complex functionality beyond basic CRUDS.

The Core layer uses CRUDS methods from **Models** and clients from **Services** to implement multi-step workflows, enforce business rules, and coordinate cross-model operations.

> **Note:** This project does not include a `/core` folder, as it is a basic CRUDS API demonstration.

### 📁 Background

The `/background` folder contains code responsible for **executing background jobs**—tasks that run **outside the scope of an API request**.

These jobs often **manipulate data** defined in `/models` and apply **business logic** from `/core`.

For this reason, `/background` sits higher in the import order.

Some models or core logic may trigger background jobs (e.g., updating an embedding vector after a CRUDS operation). To avoid circular imports, **publishers** (functions that enqueue tasks) and **handlers** (functions that process tasks) are separated into modules that do not import each other.

A model can import a publisher to trigger a task, while a handler can import the same model to process that task—avoiding circular dependencies.

**publishers** and **handlers** share common parameters (e.g., broker URLs, task names, queue names, execution order). A **bgconfig** module stores these shared parameters, which both publishers and handlers import.

**crons** is the fourth submodule of `/background`. It contains scheduled tasks that periodically trigger jobs by calling a **publisher**.

**Import order within `/background`:**

1. **bgconfig** (lowest - shared config)
2. **publishers** (imports setup, can be imported by models)
3. **crons** (imports publishers)
4. **handlers** (highest - imports setup + models)

### 📁 Bin

Includes scripts for **data migration**, **debugging**, or **manual testing**.

> This folder was initially named **scripts**. It was renamed to **bin** because **Rust** provides special support for executing code placed in this directory.

### 📁 API

The `/api` folder contains all logic related to **HTTP request handling**, **authentication**, **middleware**, and **API documentation**.

It acts as the main entry point for routing requests to the appropriate backend logic and sits in the upper tier of the import order.

It includes the following subfolders:

#### 📁📁 Middlewares

Contains middleware functions that apply logic **before or after route handling**, including:

- **Authentication & Authorization**
- **CORS policies**
- **Request/Response validation**
- **Error handling**
- **Rate limiting**

> ⚠️ Different frameworks implement this concept differently: **Express/Gin** use traditional middleware functions, **FastAPI** uses dependency injection (`Depends()`), and **Axum** uses extractors for request data and Tower middleware layers for cross-cutting concerns. Despite these implementation differences, the core concept remains the same: reusable logic that executes around route handlers and extracts data from the incoming request.

#### 📁📁 Docs

Contains code responsible for setting up the **Swagger/OpenAPI documentation**.

**Documentation generation varies by framework**:

- **Express**: Manual setup using `swagger-jsdoc` or decorators
- **FastAPI**: Automatically generates Swagger UI from route and schema definitions
- **Gin**: Uses `swaggo/swag` with comment annotations to generate OpenAPI specs
- **Axum**: Manual setup using `utoipa` crate for Rust macro-based documentation

#### 📁📁 Routes

Defines the actual **REST API endpoints** for each resource/data model.

Each model exposes a standardized set of **6 CRUDS endpoints**, ensuring consistency across all backends:

| Method | Path                 | Purpose                                  | Input Schema | Output Schema       | CRUDS Method                     |
| ------ | -------------------- | ---------------------------------------- | ------------ | ------------------- | -------------------------------- |
| GET    | `/model-name/`       | Search with filters via query parameters | Query Params | PaginatedDataSchema | `paginate()` or `userPaginate()` |
| POST   | `/model-name/search` | Search with filters via request body     | SearchSchema | PaginatedDataSchema | `paginate()` or `userPaginate()` |
| POST   | `/model-name/`       | Create a new record                      | PostSchema   | ReadSchema          | `post()` or `userPost()`         |
| GET    | `/model-name/:id`    | Retrieve a single record by ID           | Query Params | ReadSchema          | `get()` or `userGet()`           |
| PUT    | `/model-name/:id`    | Update an existing record                | PutSchema    | ReadSchema          | `put()` or `userPut()`           |
| DELETE | `/model-name/:id`    | Delete a record by ID                    | –            | –                   | `delete()` or `userDelete()`     |

> **Note:** For `GET /model-name/`, query params are parsed and converted into a `SearchSchema` via middleware. For `GET /model-name/:id`, optional `fields` query param controls which fields are returned.

##### 🔍 Search API

The `GET /model-name/` and `POST /model-name/search` endpoints support advanced filtering, field selection, sorting, and pagination.

**Accepted query parameters:**

- `page` and `size` – Pagination controls
- `fields` – Select which fields to return (field projection)
- `sort` – Sort order (prefix with `-` for descending)
- Filter fields – Any filterable field with optional operators

Each filtering query parameter follows the pattern: **`field=operator:value`**

If no operator is provided, `eq` (equals) is assumed. For nested fields, aliases may be used (e.g., `zipcode` for `address.zipcode`).

**Supported operators:**

| Operator | Meaning                  | Example                    |
| -------- | ------------------------ | -------------------------- |
| `eq`     | Equals                   | `age=eq:30`                |
| `ne`     | Not equals               | `status=ne:inactive`       |
| `gt`     | Greater than             | `age=gt:18`                |
| `gte`    | Greater or equal         | `age=gte:21`               |
| `lt`     | Less than                | `price=lt:100`             |
| `lte`    | Less or equal            | `age=lte:65`               |
| `in`     | In list                  | `status=in:active,pending` |
| `nin`    | Not in list              | `role=nin:admin,moderator` |
| `like`   | Pattern match (SQL LIKE) | `name=like:John%`          |
| `regex`  | Regex match              | `email=regex:.*@gmail.com` |

**Example GET request:**

```
/users?fields=name,age&age=gte:30&age=lte:40&name=like:%Slim%&zipcode=2040&sort=-age
```

Returns:

- User's `name` and `age` fields only (`fields=name,age`)
- Users whose age is between 30 and 40 (`age=gte:30&age=lte:40`)
- Whose name contains `'Slim'` (`name=like:%Slim%`)
- Whose address has `zipcode=2040` (`zipcode=2040`)
- Sorted by descending age (`sort=-age`)

This translates to SQL similar to:

```sql
SELECT name, age FROM users
WHERE age >= 30
  AND age <= 40
  AND name LIKE '%Slim%'
  AND address->>'zipcode' = '2040'
ORDER BY age DESC
```

> **Note:** Query params are parsed and converted into a `SearchSchema` via middleware before being passed to the CRUDS `paginate()` method.

##### 📤 POST /model-name/search - Advanced Search

To overcome `GET` request limitations (URL length, lack of request body), the **`POST /model-name/search`** endpoint provides the same functionality using a JSON body.

The main advantage is to circumvent GET requests' URL length restrictions (~2,000 characters) for complex queries.

**Example request body:**

```json
{
    "filters": {
        "age": ["gte:30", "lte:40"],
        "name": ["like:%Slim%"],
        "zipcode": ["2040"]
    },
    "fields": ["name", "age"],
    "sort": ["-age"],
    "page": 1,
    "size": 50
}
```

This is equivalent to:

```
/users?fields=name,age&age=gte:30&age=lte:40&name=like:%Slim%&zipcode=2040&sort=-age
```

> **Note:** Filter values are always arrays because multiple operators can be applied to the same field (e.g., `age` has both `gte:30` and `lte:40`).

### 📁 Entrypoint

A single file responsible for **starting the HTTP server** and running the REST API (e.g., `index.ts`, `app.py`, `app.go`, `main.rs`).

Located at the **top of the import order**, the entrypoint:

- Imports the router/endpoints from `/api`
- Calls `/services/setup` to initialize database connections and external services
- Starts the HTTP server and begins listening for requests

This is the application's main entry point.

### 📁 Tests

Contains **unit tests**, **integration tests**, and other automated tests used to validate the application logic.

`/tests` naturally sits at the top of the import order alongside `/entrypoint`, allowing it to import and test all other modules without being imported by them.

## 📐 Frontend Structure

While backend architecture focuses on data and business logic, frontend structure emphasizes component reusability and user experience. Despite framework-specific differences, a common organizational pattern emerges across all implementations.

### 📁 `/src` Folder

Each framework has its own specifics and terminology, but a common structure can be identified.

#### 📁📁 Entrypoint

Entry files that initialize the application (`main`) and define the root component (`App`):

- **React** → `main.tsx` + `App.tsx`
- **Vue** → `main.ts` + `App.vue`
- **Svelte** → `main.ts` + `App.svelte`
- **Angular** → `main.ts` + `app.component.ts` (via `AppModule`)

#### 📁📁 Pages

Top-level components that represent **entire routes/pages** (e.g., `/login`, `/dashboard`, `/profile`)

#### 📁📁 Components

Reusable UI components and layout building blocks. This convention is shared across all frameworks.

#### 📁📁 Store

Holds **application state management** logic (e.g., user session, global UI state, cached data)

#### 📁📁 Lib

Contains general-purpose TypeScript utilities and framework specific logic such as **hooks** for React and **composables** for Vue.

#### 📁📁 Types

Shared type definitions such as `Enums`, `Interfaces`, and reusable `Types`. Centralizes consumed data models and contracts.

#### 📁📁 Assets

Static files such as images, icons, and fonts.

### 🎨 Theme Colors

This project uses [Tailwind CSS](https://tailwindcss.com/) with a custom naming system.
The goal is consistency, clarity, and avoiding clashes with Tailwind’s built-in keywords.

#### 🖼️ Surface

`surface-*` represents the **main app background layer**.
The term **surface** is preferred over `background` and `bg` to avoid naming collisions with Tailwind utilities and base CSS properties.

Variations:

- `surface` → page/app background (primary canvas)
- `surface-alt` → alternative/raised surfaces (e.g. cards)
- `surface-on` → hover/focus/highlight used on top of the surface

```css
--color-surface: var(--color-white);
--color-surface-alt: var(--color-stone-50);
--color-surface-on: var(--color-stone-100);
```

#### 📋 Panel

`panel-*` represents the **complementary surface layer** — usually opposite in brightness to the main `surface`.
This allows for clear contrast zones, such as side panels, headers/footers, or sticky overlays.
`surface`/`panel` is conceptually similar to Bootstrap’s `light`/`dark` themes.

Variations:

- `panel` → primary complementary surface
- `panel-alt` → alternative/raised complementary surface
- `panel-on` → hover/focus/highlight used on top of the panel

```css
--color-panel: var(--color-stone-700);
--color-panel-alt: var(--color-stone-600);
--color-panel-on: var(--color-stone-500);
```

#### ✒️ Pen

`pen-*` methaphorically represents things written or drawn by a pen such as text, lines and borders.
The term avoids collisions with Tailwind utilities like `text-*` or `border-*`.

Variations:

- `pen` → default text/ink color
- `pen-muted` → secondary/less prominent text
- `pen-ruler` → borders, dividers, or lines (as if drawn with a ruler)
- `pen-inverse` → text/ink used on dark panels

```css
--color-pen: var(--color-stone-700);
--color-pen-muted: var(--color-stone-500);
--color-pen-ruler: var(--color-stone-300);
--color-pen-inverse: var(--color-stone-50);
```

#### 🎨 Primary / Secondary / Success / Warning / Danger

These groups follow a similar convention to **Bootstrap’s contextual colors**.
They serve both **theming** (primary/secondary) and **functional roles** (success/warning/danger).

- `primary-*` and `secondary-*` → define the main theme colors of the dashboard along with `surface-*` and `panel-*`.
- `success-*`, `warning-*`, `danger-*` → used for conveying functional meaning (feedback, alerts, validation).
- Each group provides consistent variations:
    - `-on` → used for hover, focus, or active states
    - `-surface` → inverted version, aligned with the main `surface` brightness

```css
--color-primary: var(--color-sky-400);
--color-primary-on: var(--color-sky-600);
--color-primary-surface: var(--color-sky-50);

--color-secondary: var(--color-pink-500);
--color-secondary-on: var(--color-pink-600);
--color-secondary-surface: var(--color-pink-50);

--color-success: var(--color-teal-500);
--color-success-on: var(--color-teal-600);
--color-success-surface: var(--color-teal-50);

--color-warning: var(--color-orange-500);
--color-warning-on: var(--color-orange-600);
--color-warning-surface: var(--color-orange-50);

--color-danger: var(--color-red-500);
--color-danger-on: var(--color-red-600);
--color-danger-surface: var(--color-red-50);
```

#### 🚫 Disabled

The `disabled-*` group defines styles for **inactive or disabled form inputs**.
It ensures consistency across backgrounds, text, and borders.

Variations:

- `disabled-surface` → background of a disabled input
- `disabled-pen` → text color of a disabled input
- `disabled-ruler` → border/outline color of a disabled input

```css
--color-disabled-surface: var(--color-gray-300);
--color-disabled-pen: var(--color-gray-500);
--color-disabled-ruler: var(--color-gray-300);
```

#### 🎭 Backdrop

The `backdrop` color is used for **overlay layers** behind modals, dialogs, or drawers.
It helps separate focus areas from the rest of the UI.

```css
--color-backdrop: var(--color-stone-300);
```

## 🚀 Next Steps

- Add the **Rust/Axum** backend (ongoing)
- Add an **Angular** SPA frontend

# 🔧 Multi-Stack Fullstack Project

This project is an exploration of modern fullstack development by building and comparing interchangeable backend APIs and frontend SPAs using different technologies.

## 💡 Project Overview

The core idea is to **replicate the same REST API and frontend application** across multiple tech stacks and make them **fully interchangeable**.

All backends expose **identical endpoints**, and all frontends consume the same APIs, enabling any frontend to work with any backend without modification.

This setup allows for:

-   Comparing **code structure**, **developer experience**, and **performance**
-   Experimenting with new technologies in a real-world scenario
-   Understanding how to build scalable, interchangeable services

## 🧱 Technology Stack

### 🔙 Backends

Each backend implements the **same logic**, **routes**, and **data models**:

-   **TypeScript** – using [Express](https://expressjs.com/)
-   **Python** – using [FastAPI](https://fastapi.tiangolo.com/)
-   **Go** – using [Gin](https://gin-gonic.com/)
-   **Rust** – using [Axum](https://github.com/tokio-rs/axum)

Each backend connects to a shared set of services (e.g., MongoDB, Redis).

### 🔜 Frontends

Each frontend is a modern **SPA** built with:

-   **React**
-   **Vue**
-   **Angular**
-   **Svelte**

All frontends communicate with any backend through the same REST API, enabling **plug-and-play** architecture.

## 🐳 Dockerized Setup

Each app (frontend/backend) lives in its own folder (e.g., `/express`, `/react`, etc.) and is containerized using Docker.

### 🔗 Shared Services (via `docker-compose.yaml`)

-   **MongoDB**: A MongoDB replica set with `mongo1`, `mongo2`, and a `mongo-setup` container to initialize the replica configuration.
-   **Mongo Express**: Web-based UI for browsing and managing MongoDB data.
-   **Fake GCS Server**: A local emulator for Google Cloud Storage, using [`fsouza/fake-gcs-server`](https://github.com/fsouza/fake-gcs-server).
-   **Redis**: In-memory database used for caching and as a message broker.
-   **RedisInsight**: Web UI for inspecting and managing Redis data.

## ⚠️ Disclaimer

This project came to fruition after taking the following Udemy course:  
[React, NodeJS, Express & MongoDB - The MERN Fullstack Guide](https://www.udemy.com/course/react-nodejs-express-mongodb-the-mern-fullstack-guide/)

**Key differences:**

-   Rewritten using **TypeScript** (course uses plain JavaScript)
-   **Different folder structure** and **project architecture**
-   Some **CSS/UI components** are reused

## 📐 Backend Building

### 📁 Models

The first step in building a backend is to **design the data layer**—defining how data is structured, validated, and manipulated. A well-thought-out model setup is critical not only for development but also for testing, seeding, and consistency across different backend implementations.

Each backend will include a `models/` folder containing several key subfolders to handle different schema use-cases.

#### 📁 📁 Schemas

We break down schema definitions based on their **specific purpose** in the application lifecycle: creation, seeding, reading, editing, querying...

##### 📦 DB Schema

-   Defines how the data is stored in the database.
-   Includes all internal fields, references, and indexing.

##### 🌱 Seed Schema

-   Used for generating dummy data when seeding a test database.
-   Can include reference fields to link documents across collections.

##### ✍️ Creation Schema

-   Represents the structure of a new document before it's inserted.
-   Typically excludes fields like IDs or reverse relationships.

##### 📤 Post Schema

-   Defines the structure of the data received via `HTTP POST` to create a record.
-   May differ from the creation schema (e.g. an object has an `imageUrl` field stored but the user uploads an image file instead of sending the `imageUrl` string).

##### 🔧 Update Schema

-   Describes partial updates to existing documents.
-   Often allows optional fields for flexible updates.

##### 📥 Put Schema

-   Defines the structure of the data received via `HTTP PUT`.
-   May differ from the update schema (e.g. an object has an `imageUrl` field stored but the user uploads an image file instead of sending the `imageUrl` string).

##### 📄 Read Schema

-   Used when retrieving data from the database to return to clients.
-   Sensitive or internal fields (e.g., passwords) are omitted for security.

##### 📃 Paginated Data Schema

-   Used when returning search results in pages.
-   Handles metadata like `totalCount`, `page`, `pageSize`, and `data`.

##### 🔍 Search Schema

-   Defines the format for complex queries with filters, sorting, paginating etc...

#### 📁📁 Collections

Depending on the programming language and available stack, an ORM or ODM (Object Document Mapper) may be used to interact with the MongoDB database.

The `/collections` folder contains the **implementation of each model** using the chosen ORM/ODM.

Each collection ties the schema definitions to the actual database logic, enabling CRUD operations, relationships, and additional behaviors.

#### 📁📁 Crud

For each collection, a corresponding **CRUD object** is created to encapsulate its business logic—handling all Create, Read, Update, and Delete operations.

To promote structure and security, CRUD operations are organized into **three layers**:

1. **`*_Document` methods**: Direct interaction with the ORM/database layer.
2. **Main methods**: High-level interface that uses schemas (e.g., converts `PostSchema` → `CreateSchema`).
3. **`safe*` methods**: Add authorization and access control logic.

Below the operations breakdown

##### 📄 get

-   `getDocument`: Fetches a single raw ORM object by ID.
-   `get`: Returns the object in a `ReadSchema`.
-   `safeGet`: Ensures the requesting user has access to the document.

##### 📚 fetch

-   `fetchDocuments`: Queries the DB with filters, projections, pagination, etc.
-   `fetch`: Returns results in a `PaginatedDataSchema`.
-   `safeFetch`: Restricts results to data the user has access to.

##### ✏️ create

-   `createDocument`: Creates a new record using a `CreateSchema`, inside a transaction.
-   `create`: Converts a `PostSchema` to a `CreateSchema`, then calls `createDocument`.
-   `safeCreate`: Prevents unauthorized field assignment or object relations (e.g., assigning ownership improperly).

##### 🛠️ update

-   `updateDocument`: Updates an existing record using an `UpdateSchema`, inside a transaction.
-   `update`: Converts a `PutSchema` to an `UpdateSchema`, then calls `updateDocument`.
-   `safeUpdate`: Prevents illegal changes to relationships or protected fields.

##### 🗑️ delete

-   `deleteDocument`: Deletes a record using a Mongo transaction.
-   `safeDelete`: Ensures the user is authorized to delete the object.
-   `deleteCleanup`: Optional cleanup logic after deletion (e.g., removing related files from cloud storage).

#### 📁📁 Examples

This folder contains **example documents** for each model, along with utility methods to **seed the database** and **dump data** for backup or testing.

Each example is structured using the [Seed Schema](#seed-schema) defined in the `schemas/` folder.

## 📐 Frontend building

## 🚀 Next Steps

-   Add the **Python/FastAPI** backend
-   Add the **Go/Gin** backend

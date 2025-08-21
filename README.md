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

### 🗄️ Database: Why MongoDB over PostgreSQL?

While PostgreSQL is a powerful and mature relational database, this project opts for **MongoDB** — a NoSQL, document-oriented database — for the following reasons:

-   **Natural Data Modeling**: API responses and application data often involve deeply nested object structures. MongoDB’s document model aligns directly with this, reducing the need for complex relational mapping.
-   **Simplified Queries**: In PostgreSQL, deeply related data requires multiple tables and joins (e.g., grandchild → child → parent). In MongoDB, such structures can often be embedded within a single collection, improving readability and performance.
-   **JSON Support in PostgreSQL is Limited**: While PostgreSQL supports JSON columns, querying and manipulating nested JSON fields in SQL can become verbose and less intuitive. MongoDB was designed around JSON-style documents, making these operations more seamless.

> For projects involving hierarchical data, flexible schemas, or nested documents, MongoDB provides a more natural and efficient approach.

### 🔙 Backends

Each backend implements the **same logic**, **routes**, and **data models**:

| Language   | Web Framework                            | API Address               |
| ---------- | ---------------------------------------- | ------------------------- |
| TypeScript | [Express](https://expressjs.com/)        | http://localhost:5000/api |
| Python     | [FastAPI](https://fastapi.tiangolo.com/) | http://localhost:5001/api |
| Go         | [Gin](https://gin-gonic.com/)            | _Not Implemented Yet_     |
| Rust       | [Axum](https://github.com/tokio-rs/axum) | _Not Implemented Yet_     |

Each backend connects to a shared set of services (e.g., MongoDB, Redis).

### 🔜 Frontends

Each frontend is a modern **Single Page Application (SPA)** built using popular frameworks:

| Framework | Dev Server URL        | Env File Example |
| --------- | --------------------- | ---------------- |
| React     | http://localhost:8000 | `react.env`      |
| Vue       | _Not Implemented Yet_ | `vue.env`        |
| Angular   | _Not Implemented Yet_ | `angular.env`    |
| Svelte    | _Not Implemented Yet_ | `svelte.env`     |

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

## 🐳 Dockerized Setup

Each app (frontend/backend) lives in its own folder (e.g., `/backend-express`, `/backend-fastapi` `/frontend-react`, etc.) and is containerized using Docker.

Prefixes `backend-` and `frontend-` are used so that the folders of the backend apps are next to each others and the folders of the frontend apps are next to each others.

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

Each backend will include a `models/` folder containing several key subfolders:

#### 📁 📁 Schemas

We break down schema definitions based on their **specific purpose** in the application lifecycle: creation, seeding, reading, editing, querying...

Each model or object will have its own schema file.

The types of schemas defined are described below:

##### 📦 DB Schema

-   Defines how the data is stored in the database.
-   Includes all internal fields and references.

##### 🌱 Seed Schema

-   Used for generating dummy data when seeding a test database.
-   Can include reference fields to link documents across collections since raw examples does not have proper indexes prior to DB injection.

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

1. **`*Document` methods**: Direct interaction with the ORM/database layer.
2. **Main methods**: High-level interface that uses schemas (e.g., converts `PostSchema` → `CreateSchema`).
3. **`safe*` methods**: Add authorization and access control logic.

Below the operations breakdown

##### 📄 get

-   `getDocument`: Fetches a single raw ORM object by ID.
-   `get`: Returns the object in a `ReadSchema` format.
-   `safeGet`: Ensures the requesting user has access to the document.

##### 📚 fetch

-   `fetchDocuments`: Queries the DB with filters, projections, pagination, etc.
-   `fetch`: Returns results in a `PaginatedDataSchema` format.
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
-   `delete`: Delete a record by id.
-   `safeDelete`: Ensures the user is authorized to delete the object.
-   `deleteCleanup`: Optional cleanup logic after deletion (e.g., removing related files from cloud storage).

#### 📁📁 Examples

This folder contains **example documents** for each model, along with utility methods to **seed/dump the database** for testing.

Each example is structured using the `SeedSchema` defined in the `schemas/` folder.

### 📁 API

Next after defining the model layer, we take care of the api layer.

The `/api` folder contains all the logic for handling **HTTP requests**, **authentication**, **middleware**, and **API documentation**. It acts as the main entry point for routing requests to the proper backend logic.

It has the following subfolders:

#### 📁📁 Auth

Handles authentication logic.  
Responsible for issuing **JWT tokens** used to authenticate and authorize users across the app.

#### 📁📁 Middlewares

Contains middleware functions that apply logic **before or after route handling**, including:

-   **CORS policies**
-   **Error handling**
-   **Authentication & Authorization**
-   **Data validation**

> ⚠️ Some frameworks (like FastAPI) use dependency injection for middleware-like behavior. However, the **concept maps closely to route-level middleware** in frameworks like Express or Gin.

#### 📁📁 Openapi

This may be a single file to set up the **OpenAPI specification** for the backend.  
It is used to **auto-generate Swagger UI documentation** from the defined routes and schemas.

> ⚠️ Depending on the framework:
>
> -   **FastAPI**: Automatically generates Swagger UI from route and schema definitions.
> -   **Express/Gin/Axum**: May require manual setup using tools like `swagger-jsdoc`, comments, or YAML/JSON files.

#### 📁📁 Routes

Defines the actual **REST API endpoints** for each resource.

Each model exposes a standardized set of **6 CRUD endpoints**, ensuring consistency across all backends:

| Method | Path                    | Purpose                                  | Input Schema   | Output Schema       | CRUD Function  |
| ------ | ----------------------- | ---------------------------------------- | -------------- | ------------------- | -------------- |
| GET    | `/model-name/`          | Search with filters via query parameters | (Query Params) | PaginatedDataSchema | `safeFetch()`  |
| POST   | `/model-name/query`     | Search with filters via request body     | SearchSchema   | PaginatedDataSchema | `safeFetch()`  |
| POST   | `/model-name/`          | Create a new record                      | PostSchema     | ReadSchema          | `safeCreate()` |
| GET    | `/model-name/:objectId` | Retrieve a single record by ID           | –              | ReadSchema          | `safeGet()`    |
| PUT    | `/model-name/:objectId` | Update an existing record                | PutSchema      | ReadSchema          | `safeUpdate()` |
| DELETE | `/model-name/:objectId` | Delete a record by ID                    | –              | –                   | `safeDelete()` |

Each route is tied to a corresponding method in the related CRUD module for consistent error handling and logic reuse.

##### 🔍 Querying

In the REST philosophy, the `GET` verb is used to retrieve data, while `POST` is typically used to create resources.

A limitation of `GET` requests is that they **do not support a request body**, which restricts how advanced queries can be expressed. Instead, filtering must rely on **query parameters**:

```
/model-name?age=25&name=Slim
```

This simple syntax works for basic use cases, but it falls short when:

-   Filtering by a **range** (e.g. age between 30 and 40)
-   Matching **substrings** or patterns (e.g. names containing a keyword)
-   Filtering on **nested fields** (e.g. `address.zipcode`)

Using a JSON body in a `POST` request would solve this, but that would break REST principles. To address this, a more expressive **query parameter syntax** is used.

Each query parameter follows the pattern: `field=operator:value`. If no operator is given, `eq` (equals) is assumed. For nested fields, an alias may be used like `addressZipcode` or just `zipcode` to filter on the `address.zipcode` nested property.

The different operations to be used are inspired by MongoDB’s query language:

```
operations = {
    eq: "$eq",
    ne: "$ne",
    gt: "$gt",
    gte: "$gte",
    lt: "$lt",
    lte: "$lte",
    in: "$in",
    nin: "$nin",
    regex: "$regex",
    text: "$text",
}
```

For example, the following request:
`/user?age=lte:40&age=gte:30&name=regex:Slim&zipcode=2040`

Would return users

-   whose age is between 30 and 40
-   whose name contains `'Slim'`
-   whose address has a `zipcode=2040`

This will translate to the following mongoDB query

```
{
  age: {
    $lte: 40,
    $gte: 30
  },
  name: {
    $regex: "Slim"
  },
  "address.zipcode": {
    $eq: 2040
  }
}

```

> A post processing of the query parameters to convert nested fields filter names may be needed (e.g. from `zipcode` to `address.zipcode`)

##### 🔁 REST vs GraphQL

A common limitation of REST APIs is **over-fetching** — retrieving more data than needed. For example, you may only need a few fields, but the API returns the entire object. This increases the size of the HTTP response, leading to higher latency and unnecessary load on the backend server.

Another issue arises with **GET request limitations**. Most browsers and servers enforce a maximum URL length (e.g. **2,083 characters in Internet Explorer**). For complex or deeply nested queries, this limit can be exceeded.

**GraphQL** addresses both problems by allowing clients to:

-   Specify exactly what data they want
-   Use a JSON body for flexible and complex queries

However, GraphQL comes with additional complexity, and in many cases, a well-designed REST API remains simpler and more approachable.

To bring some of GraphQL's flexibility into REST, this project introduces a **`POST /model-name/query`** endpoint.

It offers the same functionality as `GET /model-name`, but with more powerful querying capabilities, including:

-   **Advanced filters**
-   **Nested fields**
-   **Field projection**

The following json body

```json
{
    "name": ["regex:Slim"],
    "age": ["gte:30", "lte:40"],
    "zipcode": [2040],
    "page": 1,
    "size": 100,
    "sort": ["name"],
    "fields": ["id", "name", "address.zipcode"]
}
```

would generate this MongoDB query

```js
db.users
    .find(
        {
            name: { $regex: "Slim" },
            age: { $gte: 30, $lte: 40 },
            "address.zipcode": { $eq: 2040 },
        },
        {
            id: 1,
            name: 1,
            "address.zipcode": 1,
        }
    )
    .sort({ name: 1 })
    .skip(0)
    .limit(100);
```

### 📁 Types

Contains reusable and shared type definitions used across the project, including:

-   **Enums**: Predefined sets of constant values
-   **Interfaces / Types**: Common type definitions for data structures
-   **Custom Errors**: Standardized error classes or types
-   **Utility Types**: Generic helpers for type manipulation

### 📁 Lib

Reusable modules including:

-   **/clients** – Wrappers around third-party APIs or service interfaces (e.g., MongoDB, Redis)
-   **/encryption** – Encryption and Authentication utilities
-   **/utils** – Generic helper functions (e.g., date/string formatting, file and I/O operations)
-   **/sync** – Syncing helper to connect various clients with workers and schedulers

### 📁 Core

The `models/`, `lib`, `api/` layers are responsible for **storing, retrieving, and updating data**.

In a SaaS application, this stored data is used to **perform actions** and **deliver services** — that's where the `core/` layer comes in.  
It contains the **core business logic** that defines how the application uses the data to fulfill its purpose.

Corresponding endpoints can then be added to the `/api` layer — not just for data access, but also to trigger actions and expose services powered by this business logic.

> This project does not include a `/core` folder since it is just a very basic CRUD API

### 📁 Worker

The `worker/` layer is responsible for **executing background jobs** — tasks that should run **outside the scope of an API request**.

These jobs often apply the **business logic** defined in the `lib/` layer to perform asynchronous or scheduled operations.

> This layer is essential for building scalable SaaS applications, as it offloads work that shouldn't block real-time user interactions.

The `/worker` layer has two main subfolders:

#### 📁📁 Cron

Scheduled jobs (e.g., daily reports, cleanup tasks, notification dispatch).  
Triggered by a **cron-like scheduler**.

#### 📁📁 Tasks

Asynchronous jobs triggered by the application (e.g., sending emails, processing images, syncing data, AI model inference).  
Usually dispatched via a **message queue** or **job broker** like Redis.

> In this backend, a simple example task will be used: embedding the concatenation of two text fields (`title` + `description`) for a given model. This task is asynchronous because it may take some time to complete. The idea is to later on be able to perform smart queries using text query sent by the user and a cosine similarity lookup

### 📁 Tests

Contains **unit tests** and other automated tests to validate the application logic.

### 📁 Scripts

Includes one-off or reusable scripts for **data migration**, **debugging**, or **manual testing**.

### 📁 Static

Stores **static assets** like images or files that may be served by the backend or used for documentation/testing.

## 🚀 Next Steps

-   Add a **Vue** SPA frontend
-   Add the **Go/Gin** backend
-   Add a **Svelt** SPA frontend
-   Add the **Rust/Axium** backend
-   Add an **Angular** SPA frontend

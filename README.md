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

Each backend will include a `models/` folder containing several key subfolders:

#### 📁 📁 Schemas

We break down schema definitions based on their **specific purpose** in the application lifecycle: creation, seeding, reading, editing, querying...

Each model or object will have its own schema file.

The types of schemas defined are described below:

##### 📦 DB Schema

-   Defines how the data is stored in the database.
-   Includes all internal fields, references, and indexing.

##### 🌱 Seed Schema

-   Used for generating dummy data when seeding a test database.
-   Can include reference fields to link documents across collections since examples does not proper indexes yet.

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

### 📁 API

Next after defining the model layer, we take care of the api layer.

The `/api` folder contains all the logic for handling **HTTP requests**, **authentication**, **middleware**, and **API documentation**. It acts as the main entry point for routing requests to the proper backend logic.

It has the following subfolders:

#### 📁📁 Auth

Handles authentication logic.  
Responsible for issuing **JWT tokens** used to authenticate and authorize users across the app.

#### 📁 Middlewares

Contains middleware functions that apply logic **before or after route handling**, including:

-   **CORS policies**
-   **Error handling**
-   **Authentication & Authorization**
-   **Data validation**

> ⚠️ Some frameworks (like FastAPI) use dependency injection for middleware-like behavior. However, the **concept maps closely to route-level middleware** in frameworks like Express or Gin.

#### 📁 Openapi

This may be a single file to set up the **OpenAPI specification** for the backend.  
It is used to **auto-generate Swagger UI documentation** from the defined routes and schemas.

> ⚠️ Depending on the framework:
>
> -   **FastAPI**: Automatically generates Swagger UI from route and schema definitions.
> -   **Express/Gin/Axum**: May require manual setup using tools like `swagger-jsdoc`, comments, or YAML/JSON files.

#### 📁 Routes

Defines the actual **REST API endpoints** for each resource.

Each model exposes a standardized set of **6 CRUD endpoints**, ensuring consistency across all backends:

| Method | Path                | Purpose                                  | Input Schema   | Output Schema       | CRUD Function  |
| ------ | ------------------- | ---------------------------------------- | -------------- | ------------------- | -------------- |
| GET    | `/model-name/`      | Search with filters via query parameters | (Query Params) | PaginatedDataSchema | `safeFetch()`  |
| POST   | `/model-name/query` | Search with filters via request body     | SearchSchema   | PaginatedDataSchema | `safeFetch()`  |
| POST   | `/model-name/`      | Create a new record                      | PostSchema     | ReadSchema          | `safeCreate()` |
| GET    | `/model-name/:uuid` | Retrieve a single record by ID           | –              | ReadSchema          | `safeGet()`    |
| PUT    | `/model-name/:uuid` | Update an existing record                | PutSchema      | ReadSchema          | `safeUpdate()` |
| DELETE | `/model-name/:uuid` | Delete a record by ID                    | –              | –                   | `safeDelete()` |

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

Each query parameter follows the pattern: `field=operator:value`. If no operator is given, `eq` (equals) is assumed. The field may use dot notation to filter on nested properties.

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
`/user?age=lte:40&age=gte:30&name=regex:Slim&address.zipcode=2040`

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
    "address.zipcode": [2040],
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

## 📐 Frontend building

## 🚀 Next Steps

-   Add the **Python/FastAPI** backend
-   Add the **Go/Gin** backend
-   Add the **Rust/Axium** backend
-   Add a **Vue** SPA frontend
-   Add an **Angular** SPA frontend
-   Add a **Svelt** SPA frontend

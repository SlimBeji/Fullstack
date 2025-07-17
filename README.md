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

## 🚀 Next Steps

-   Add the **Python/FastAPI** backend
-   Add the **Go/Gin** backend

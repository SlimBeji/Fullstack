# ⚛️ React + TypeScript + Vite

This frontend app is built with **Vite** and uses **TypeScript** for static type checking and safer development.

## 🧠 State Management

The app uses the official **Redux Toolkit** library for state management, connecting the React components to a centralized Redux store.

## 🗂️ Project Structure (`/src`)

-   **`main.tsx`** – Entry point that mounts the root React component and connects the Redux store.
-   **`App.tsx`** – Defines the app’s routing logic for the single-page application.
-   **`/pages/`** – Top-level route components rendered by `App`.
-   **`/components/`** – Reusable UI components and layout building blocks.
-   **`/states/`** – Redux store, slices, and related logic.
-   **`/hooks/`** – Custom hooks like `useHttp` (for sending requests) or `useForm` (for managing form state and validation).
-   **`/types/`** – Shared type definitions including `Enums`, `Interfaces`, and reusable `Types`.
-   **`/static/`** – Static assets such as image placeholders or icons.
-   **`/util/`** – Utility functions and general-purpose helpers.

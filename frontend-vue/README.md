# 🟢 Vue 3 + TypeScript + Vite

This frontend app is built with **Vite** and uses **TypeScript** for static type checking and safer development.

## 🔐 Environment Variables

The Vue client relies on a `.env` file for configuration.

```
VITE_BACKEND_URL=http://localhost:5001/api
```

## 🧠 State Management

The app uses **Pinia** as the official state management library for Vue 3, connecting components to centralized and modular stores.

## 🗂️ Project Structure (`/src`)

-   **`main.ts`** – Application entry point; creates the Vue app, configures plugins, and mounts the root component.
-   **`App.vue`** – Root Vue component defining the global layout and routing.
-   **`/router/`** – Centralized application routing configuration (Vue Router).
-   **`/views/`** – Top-level route components rendered by `App`.
-   **`/components/`** – Reusable UI components and layout building blocks.
-   **`/stores/`** – Pinia stores containing application state and related logic.
-   **`/lib/`** – Contains reusable Vue logic including composables and general-purpose TypeScript utilities.
-   **`/types/`** – Shared type definitions including `Enums`, `Interfaces`, and reusable `Types`.
-   **`/assets/`** – Static assets such as image placeholders or icons.

## 🧹 Linting

This app uses **[ESLint](https://eslint.org/)** and **[Prettier](https://prettier.io/)** to ensure consistent code quality and formatting.

### 🛠 ESLint

The configuration uses the modern `eslint.config.js` format and includes the following plugins:

-   **[@typescript-eslint](https://typescript-eslint.io/):** TypeScript-specific linting rules.
-   **[eslint-plugin-unused-imports](https://www.npmjs.com/package/eslint-plugin-unused-imports):**  
    Automatically detects and removes unused imports and variables.
-   **[eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort):**  
    Enforces consistent ordering of imports and exports.

#### 🔑 Key ESLint Rules

-   `no-unused-vars` and `no-undef`: **Disabled** (handled by TypeScript and `unused-imports`).
-   `unused-imports/no-unused-vars`: **Warn**, ignores variables/args starting with `_`.
-   `@typescript-eslint/no-explicit-any`: **Disabled** to allow use of `any` during development.
-   `no-useless-escape`: **Disabled** to avoid messing with regular expressions.

### 🎨 Prettier

Prettier is used for formatting with the following config:

```json
{
    "tabWidth": 4,
    "trailingComma": "es5"
}
```

## 🛠️ Makefile Commands (Vue)

The following `make` commands help manage the React frontend:

| Command          | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `make vue-build` | Build the Docker container and install dependencies in `frontend-vue/`.   |
| `make vue-bash`  | Open an interactive shell inside the running Vue container.               |
| `make vue-lint`  | Run TypeScript type checks, ESLint fixes, and format files with Prettier. |

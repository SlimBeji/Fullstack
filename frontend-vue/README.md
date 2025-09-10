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

- **`main.ts`** – Application entry point; creates the Vue app, configures plugins, and mounts the root component.
- **`App.vue`** – Root Vue component defining the global layout and routing.
- **`/router/`** – Centralized application routing configuration (Vue Router).
- **`/views/`** – Top-level route components rendered by `App`.
- **`/components/`** – Reusable UI components and layout building blocks.
- **`/stores/`** – Pinia stores containing application state and related logic.
- **`/lib/`** – Contains reusable Vue logic including composables and general-purpose TypeScript utilities.
- **`/types/`** – Shared type definitions including `Enums`, `Interfaces`, and reusable `Types`.
- **`/assets/`** – Static assets such as image placeholders or icons.

## 🧹 Linting

This project was created with npm create vue@latest, with ESLint (error checking) and Prettier (code formatting) enabled from the start.

### 🔑 ESLint Customization

- Added eslint-plugin-simple-import-sort to keep imports consistently ordered.
- Disabled vue/multi-word-component-names to allow single-word component names.

```js
{
    plugins: {
        "simple-import-sort": pluginImportSort,
    },
    rules: {
        "vue/multi-word-component-names": "off",
        "simple-import-sort/imports": "warn",
        "simple-import-sort/exports": "warn",
    },
}
```

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

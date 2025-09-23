# 🟢 Vue 3 + TypeScript + Vite

This frontend app is built with **Vite** and uses **TypeScript** for static type checking and safer development.

## 🔐 Environment Variables

The Vue client relies on a `vue.env` file for configuration.

```
VITE_BACKEND_URL=http://localhost:5001/api
```

## 🧠 State Management

The app uses **Pinia** as the official state management library for Vue 3, connecting components to centralized and modular stores.

## 🗂️ Project Structure (`/src`)

- **`main.ts`** – Application entry point; creates the Vue app, configures plugins, and mounts the root component.
- **`App.vue`** – Root Vue component defining the global layout and routing.
- **`/router/`** – Centralized application routing configuration (Vue Router).
- **`/pages/`** – Top-level route components rendered by `App`.
- **`/components/`** – Reusable UI components and layout building blocks.
- **`/stores/`** – Pinia stores containing application state and related logic.
- **`/lib/`** – Contains reusable Vue logic including composables and general-purpose TypeScript utilities.
- **`/types/`** – Shared type definitions including `Enums`, `Interfaces`, and reusable `Types`.
- **`/assets/`** – Static assets such as image placeholders or icons.

> The term `/pages` was preferred to the more common `/views` used by Vue community just to keep the analogy between different frameworks

## 🧹 Linting

This project was created with npm create vue@latest, with ESLint (error checking) and Prettier (code formatting) enabled from the start.

### 🔑 ESLint Customization

- Added eslint-plugin-simple-import-sort to keep imports consistently ordered.
- Added eslint-plugin-import and eslint-import-resolver-typescript to catch unresolved imports.
- Disabled vue/multi-word-component-names to allow single-word component names.
- Enable usage of `any` keyword.

```js
{
        plugins: {
            "simple-import-sort": pluginImportSort,
            import: pluginImport,
        },
        settings: {
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.app.json",
                },
                node: {
                    extensions: [".js", ".ts", ".vue"],
                },
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "vue/multi-word-component-names": "off",
            "simple-import-sort/imports": "warn",
            "simple-import-sort/exports": "warn",
            "import/no-unresolved": ["error", { commonjs: true, amd: true }],
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

The following `make` commands help manage the Vue frontend:

| Command          | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `make vue-build` | Build the Docker container and install dependencies in `frontend-vue/`.   |
| `make vue-bash`  | Open an interactive shell inside the running Vue container.               |
| `make vue-lint`  | Run TypeScript type checks, ESLint fixes, and format files with Prettier. |

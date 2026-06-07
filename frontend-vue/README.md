# 🟢 Vue 3 + Bun + TypeScript + Vite

This frontend app was built with **Vite** and uses **TypeScript** for static type checking and safer development.

```
bunx create-vite frontend-vue
```

## 🔐 Environment Variables

The Vue client relies on a `vue.env` file for configuration.

```
VITE_BACKEND_URL=http://localhost:5001/api
```

## 🧠 State Management

The app uses **Pinia** as the official state management library for Vue 3, connecting components to centralized and modular stores.

## 🗂️ Project Structure (`/src`)

- **`main.ts`** – Application entry point; mounts the root `<App />` component and sets up the Pinia store and router.
- **`App.vue`** – Root component responsible for global layout and route configuration.
- **`/router/`** – Centralized routing configuration.
- **`/pages/`** – Top-level route components, each corresponding to a distinct application view.
- **`/components/`** – Reusable UI components and layout building blocks.
- **`/composables/`** – Custom Vue composables encapsulating reusable logic (analogous to services in **Angular**, hooks in **React**).
- **`/store/`** – Pinia store setup and related state management logic.
- **`/storage/`** – Helpers for interacting with the browser's native storage APIs.
- **`/utils/`** – General-purpose, framework-agnostic TypeScript utilities.
- **`/types/`** – Shared TypeScript interfaces and type definitions, covering both API response shapes and reusable app-wide types.

> The term `/pages` was preferred to the more common `/views` used by Vue community just to keep the analogy between different frameworks

## 🧹 Linting

This app uses **[ESLint](https://eslint.org/)** and **[Prettier](https://prettier.io/)** to ensure consistent code quality and formatting.

### 🛠 ESLint

The configuration uses the modern `eslint.config.js` flat config format with Vue's `defineConfigWithVueTs()` and includes the following plugins:

- **[eslint-plugin-vue](https://eslint.vuejs.org/):** Vue-specific linting rules for `.vue` files.
- **[@vue/eslint-config-typescript](https://github.com/vuejs/eslint-config-typescript):** TypeScript support tailored for Vue projects.
- **[@vue/eslint-config-prettier](https://github.com/vuejs/eslint-config-prettier):** Disables ESLint rules that conflict with Prettier formatting.
- **[eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort):**
  Enforces consistent ordering of imports and exports.
- **[eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import):**
  Validates import resolution and prevents unresolved modules.

#### 🔑 Key ESLint Rules

- `@typescript-eslint/no-explicit-any`: **Disabled** to allow use of `any` during development.
- `@typescript-eslint/consistent-type-imports`: **Warn**, enforces the use of `import type` where applicable.
- `vue/multi-word-component-names`: **Disabled** to allow single-word component names.
- `simple-import-sort/imports` and `simple-import-sort/exports`: **Warn**, enforces consistent import/export ordering.
- `import/no-unresolved`: **Error**, ensures all imports can be resolved.

### 🔑 ESLint Customization

- Added eslint-plugin-simple-import-sort to keep imports consistently ordered.
- Added eslint-plugin-import and eslint-import-resolver-typescript to catch unresolved imports.
- Disabled vue/multi-word-component-names to allow single-word component names.
- Enable usage of `any` keyword.
- Enforcing the use of `import type` where applicable.

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

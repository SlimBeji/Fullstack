# 🟢 Svelte + Bun +TypeScript + Vite

This frontend app was built with **Vite** and uses **TypeScript** for static type checking and safer development.

```
bunx create-vite frontend-svelte
```

## 🔐 Environment Variables

The Svelte client relies on a `svelte.env` file for configuration.

```
VITE_BACKEND_URL=http://localhost:5001/api
```

## 🧠 State Management

The app uses **Svelte stores** for state management, providing a simple and reactive way to share data between components.
Stores such as `writable`, `readable`, and `derived` make it easy to centralize and organize state without the need for an external library.

## 🗂️ Project Structure (`/src`)

- **`main.ts`** – Application entry point; mounts the root `<App />` component and sets up the Pinia store and router.
- **`App.svelte`** – Root component responsible for global layout and route configuration.
- **`/router/`** – Application routing configuration using `@mateothegreat/svelte5-router`.
- **`/pages/`** – Top-level route components, each corresponding to a distinct application view.
- **`/components/`** – Reusable UI components and layout building blocks.
- **`/composables/`** – Custom Svelte composables encapsulating reusable logic (analogous to services in **Angular**, hooks in **React**).
- **`/store/`** – Svelte store containing application state and related logic.
- **`/storage/`** – Helpers for interacting with the browser's native storage APIs.
- **`/utils/`** – General-purpose, framework-agnostic TypeScript utilities.
- **`/types/`** – Shared TypeScript interfaces and type definitions, covering both API response shapes and reusable app-wide types.

> `/pages` was preferred over the more common `/routes` used by the SvelteKit community to maintain naming consistency across different framework projects.

## 🧹 Linting

This app uses **[ESLint](https://eslint.org/)** and **[Prettier](https://prettier.io/)** to ensure consistent code quality and formatting.

### 🛠 ESLint

The configuration uses the modern `eslint.config.js` flat config format and includes the following plugins:

- **[eslint-plugin-svelte](https://sveltejs.github.io/eslint-plugin-svelte/):** Svelte-specific linting rules for `.svelte` files.
- **[@typescript-eslint](https://typescript-eslint.io/):** TypeScript-specific linting rules.
- **[eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort):**
  Enforces consistent ordering of imports and exports.
- **[eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import):**
  Validates import resolution and prevents unresolved modules.
- **[eslint-config-prettier](https://github.com/prettier/eslint-config-prettier):**
  Disables ESLint rules that conflict with Prettier formatting.

#### 🔑 Key ESLint Rules

- `@typescript-eslint/no-explicit-any`: **Disabled** to allow use of `any` during development.
- `no-useless-escape`: **Disabled** to avoid messing with regular expressions.
- `@typescript-eslint/consistent-type-imports`: **Warn**, enforces the use of `import type` where applicable.
- `simple-import-sort/imports` and `simple-import-sort/exports`: **Warn**, enforces consistent import/export ordering.
- `import/no-unresolved`: **Error**, ensures all imports can be resolved.
- Svelte-native component rules are enforced alongside the above.

### 🔑 ESLint Customization

Eslint support was not supported out of the box when using `npm create vite@latest` with svelete.

**eslint.config.ts** was added manually after installing the corresponding packages.

### 🎨 Prettier

Prettier was added with the following command and config: `npm install -D prettier prettier-plugin-svelte`:

```json
{
    "tabWidth": 4,
    "trailingComma": "es5",
    "plugins": ["prettier-plugin-svelte"],
    "semi": true,
    "singleQuote": false,
    "svelteSortOrder": "scripts-markup-styles-options",
    "svelteStrictMode": true,
    "svelteAllowShorthand": true,
    "svelteIndentScriptAndStyle": true
}
```

## 🛠️ Makefile Commands (Svelte)

The following `make` commands help manage the React frontend:

| Command             | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `make svelte-build` | Build the Docker container and install dependencies in `frontend-svelte/`. |
| `make svelte-bash`  | Open an interactive shell inside the running Svelte container.             |
| `make svelte-lint`  | Run TypeScript type checks, ESLint fixes, and format files with Prettier.  |

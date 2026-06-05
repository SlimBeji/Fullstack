# ⚛️ Angular + Bun

This frontend app was with following command:

```
bunx create-vite frontend-angular
```

## 🔐 Environment Variables

The Angular client relies on a `angular.env` file for configuration.

```
NG_APP_BACKEND_URL=http://localhost:5003/api
```

## 🧠 State Management

The app uses **NgRx** for state management, connecting Angular components to a centralized and reactive store based on the Redux pattern.

## 🗂️ Project Structure (`/src`)

- **`main.ts`** – Application entry point; bootstraps the root `App` component.
- **`/app`** – Root Angular component, app configuration and routing bootstrap.
- **`/router/`** – Centralized application routing configuration (Angular Router).
- **`/pages/`** – Top-level route components rendered by `App`.
- **`/components/`** – Reusable UI components and layout building blocks.
- **`/store/`** – NgRx store, actions, reducers, selectors, and effects.
- **`/services/`** – Angular services similat to react hooks, vue composables and svelte.
- **`/lib/`** – Shared utilities, helper functions, and general-purpose TypeScript logic.
- **`/types/`** – Shared type definitions including `Enums`, `Interfaces`, and reusable `Types`.
- **`/assets/`** – Static assets such as images, icons, or fonts.

## 🧹 Linting

This app uses **[ESLint](https://eslint.org/)** and **[Prettier](https://prettier.io/)** to ensure consistent code quality and formatting.

### 🛠 ESLint

The configuration uses the modern `eslint.config.js` format with ESLint core's `defineConfig()` and includes the following plugins:

- **[@typescript-eslint](https://typescript-eslint.io/):** TypeScript-specific linting rules.
- **[eslint-plugin-unused-imports](https://www.npmjs.com/package/eslint-plugin-unused-imports):**
  Automatically detects and removes unused imports and variables.
- **[eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort):**
  Enforces consistent ordering of imports and exports.

#### 🔑 Key ESLint Rules

- `no-unused-vars` and `no-undef`: **Disabled** (handled by TypeScript and `unused-imports`).
- `unused-imports/no-unused-vars`: **Warn**, ignores variables/args starting with `_`.
- `@typescript-eslint/no-explicit-any`: **Disabled** to allow use of `any` during development.
- `no-useless-escape`: **Disabled** to avoid messing with regular expressions.
- `@typescript-eslint/consistent-type-imports`: **Warn**, enforces the use of `import type` where applicable.
- Svelte-native component rules are enforced alongside the above.

### 🎨 Prettier

Prettier is used for formatting with the following config:

```json
{
    "tabWidth": 4,
    "trailingComma": "es5",
    "printWidth": 100,
    "singleQuote": true,
    "overrides": [
        {
            "files": "*.html",
            "options": {
                "parser": "angular"
            }
        }
    ]
}

```

## 🛠️ Makefile Commands (Angular)

The following `make` commands help manage the Angular frontend:

| Command              | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `make angular-build` | Build the Docker container and install dependencies in `frontend-angular/`. |
| `make angular-bash`  | Open an interactive shell inside the running Angular container.             |
| `make angular-lint`  | Run TypeScript type checks, ESLint fixes, and format files with Prettier.   |

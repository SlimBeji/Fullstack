# ⚛️ React + Bun + TypeScript + Vite

This frontend app was built with **Vite** and uses **TypeScript** for static type checking and safer development.

```
bunx create-vite frontend-react
```

## 🔐 Environment Variables

The React client relies on a `react.env` file for configuration.

```
VITE_BACKEND_URL=http://localhost:5000/api
```

## 🧠 State Management

The app uses the official **Redux Toolkit** library for state management, connecting the React components to a centralized Redux store.

## 🗂️ Project Structure (`/src`)

- **`main.tsx`** – Application entry point; renders the root <App /> component and sets up the Redux store provider.
- **`App.tsx`** – Root component defining the global layout and routing.
- **`/router/`** – Centralized application routing configuration.
- **`/pages/`** – Top-level route components rendered by `App`.
- **`/components/`** – Reusable UI components and layout building blocks.
- **`/store/`** – Redux store, slices, and related logic and hooks.
- **`/lib/`** – Contains reusable React logic including custom hooks and general-purpose TypeScript utilities.
- **`/types/`** – Shared type definitions including `Enums`, `Interfaces`, and reusable `Types`.
- **`/assets/`** – Static assets such as image placeholders or icons.

## 🧹 Linting

This app uses **[ESLint](https://eslint.org/)** and **[Prettier](https://prettier.io/)** to ensure consistent code quality and formatting.

### 🛠 ESLint

The configuration uses the modern `eslint.config.js` format and includes the following plugins:

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

### 🎨 Prettier

Prettier is used for formatting with the following config:

```json
{
    "tabWidth": 4,
    "trailingComma": "es5"
}
```

## 🛠️ Makefile Commands (React)

The following `make` commands help manage the React frontend:

| Command            | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `make react-build` | Build the Docker container and install dependencies in `frontend-react/`. |
| `make react-bash`  | Open an interactive shell inside the running React container.             |
| `make react-lint`  | Run TypeScript type checks, ESLint fixes, and format files with Prettier. |

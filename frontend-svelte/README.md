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

- **`main.ts`** – Application entry point; initializes the Svelte app and mounts the root component.
- **`App.svelte`** – Root Svelte component defining the global layout and routing.
- **`/routes/`** – Application routing configuration using `@mateothegreat/svelte5-router`.
- **`/views/`** – Top-level route components rendered by `App`.
- **`/components/`** – Reusable UI components and layout building blocks.
- **`/stores/`** – Svelte stores containing application state and related logic.
- **`/lib/`** – Shared utilities and helper functions for the app (can include custom runes or general-purpose TypeScript logic).
- **`/types/`** – Shared type definitions including `Enums`, `Interfaces`, and reusable `Types`.
- **`/assets/`** – Static assets such as images, icons, or fonts.

## 🧹 Linting

This project was created with npm create vite@latest.

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

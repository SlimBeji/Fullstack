import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import pluginImportSort from "eslint-plugin-simple-import-sort";
import pluginSvelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";

export default [
    {
        ignores: [
            "**/dist/**",
            "**/dist-ssr/**",
            "**/coverage/**",
            "node_modules",
        ],
    },
    js.configs.recommended,
    ...pluginSvelte.configs["flat/recommended"],
    {
        files: ["**/*.{js,ts,svelte}"],
        languageOptions: {
            globals: globals.browser,
            parser: tsParser,
            parserOptions: {
                project: ["./tsconfig.app.json", "./tsconfig.node.json"],
                extraFileExtensions: [".svelte"],
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
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
                    extensions: [".js", ".ts", ".svelte"],
                },
            },
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...prettier.rules,
            "@typescript-eslint/no-explicit-any": "off",
            "simple-import-sort/imports": "warn",
            "simple-import-sort/exports": "warn",
            "import/no-unresolved": [
                "error",
                { ignore: ["^/"], commonjs: true, amd: true },
            ],
        },
    },
    {
        files: ["**/*.svelte"],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsParser, // TS inside <script>
                project: "./tsconfig.app.json",
                extraFileExtensions: [".svelte"],
            },
        },
    },
    {
        files: ["eslint.config.*", "svelte.config.*"],
        languageOptions: {
            parserOptions: {
                project: null,
            },
        },
    },
];

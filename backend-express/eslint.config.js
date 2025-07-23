import tseslint from "typescript-eslint";

import parser from "@typescript-eslint/parser";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import pluginImportSort from "eslint-plugin-simple-import-sort";

export default [
    {
        ignores: ["build/**"],
        files: ["**/*.ts"],
        languageOptions: {
            parser: parser,
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        plugins: {
            "unused-imports": pluginUnusedImports,
            "simple-import-sort": pluginImportSort,
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            "no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "no-undef": "off",
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];

import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import {
    defineConfigWithVueTs,
    vueTsConfigs,
} from "@vue/eslint-config-typescript";
import { globalIgnores } from "eslint/config";
import pluginImport from "eslint-plugin-import";
import pluginImportSort from "eslint-plugin-simple-import-sort";
import pluginVue from "eslint-plugin-vue";

export default defineConfigWithVueTs(
    {
        name: "app/files-to-lint",
        files: ["**/*.{ts,mts,tsx,vue}"],
    },

    globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

    pluginVue.configs["flat/essential"],
    vueTsConfigs.recommended,
    skipFormatting,

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
);

import js from "@eslint/js"
import globals from "globals"

export default [
    {
        ignores: ["node_modules/", "dist/", "src/vendor/", "css/"],
    },
    {
        // The game: ES modules that run in the browser
        files: ["src/**/*.js"],
        languageOptions: {
            sourceType: "module",
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        rules: {
            ...js.configs.recommended.rules,
            // Functions and data are shared between script files as globals,
            // and many are only called from onClick attributes in index.html.
            // Revisit once the game moves to ES modules.
            "no-undef": "off",
            "no-unused-vars": "off",
            "no-var": "error",
            "prefer-const": "error",
        },
    },
    {
        files: ["test/**/*.js", "*.config.js"],
        languageOptions: {
            sourceType: "module",
            ecmaVersion: 2022,
            globals: globals.node,
        },
        rules: {
            ...js.configs.recommended.rules,
            "no-var": "error",
            "prefer-const": "error",
        },
    },
    {
        // Functions passed to page.evaluate run in the browser
        files: ["test/e2e/**/*.js"],
        languageOptions: {
            globals: globals.browser,
        },
    },
]

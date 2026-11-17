import js from "@eslint/js"
import globals from "globals"

export default [
    {
        ignores: ["node_modules/", "js/HackTimer.js", "css/"],
    },
    {
        // The game: classic browser scripts that share globals across files
        files: ["js/**/*.js"],
        languageOptions: {
            sourceType: "script",
            ecmaVersion: 2020,
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
        files: ["test/**/*.js", "playwright.config.js"],
        languageOptions: {
            sourceType: "commonjs",
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

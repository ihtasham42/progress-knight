import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"

export default [
    {
        ignores: ["node_modules/", "dist/", "css/"],
    },
    ...tseslint.configs.recommended.map(config => ({ ...config, files: ["src/**/*.{ts,tsx}", "test/types/**/*.ts"] })),
    {
        // The game's TypeScript modules, and type tests
        files: ["src/**/*.{ts,tsx}", "test/types/**/*.ts"],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            "no-var": "error",
            "prefer-const": "error",
            // A @ts-expect-error must say why
            "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }],
            // The game uses `condition ? a() : b()` as a statement in places
            "@typescript-eslint/no-unused-expressions": ["error", { allowTernary: true }],
        },
    },
    {
        // The React components and the tests that render them
        files: ["src/**/*.tsx", "test/**/*.jsx"],
        ...reactHooks.configs.flat.recommended,
    },
    {
        files: ["test/**/*.{js,jsx}", "*.config.js"],
        languageOptions: {
            sourceType: "module",
            ecmaVersion: 2022,
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: globals.node,
        },
        rules: {
            ...js.configs.recommended.rules,
            "no-var": "error",
            "prefer-const": "error",
        },
    },
    {
        // Tests that render components run in jsdom. The TypeScript parser's
        // scope analysis sees components used in JSX.
        files: ["test/**/*.jsx"],
        languageOptions: {
            parser: tseslint.parser,
            globals: { ...globals.node, ...globals.browser },
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

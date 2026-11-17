import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.js"],
        // The golden run plays two whole lives
        testTimeout: 120000,
    },
})

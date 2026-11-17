import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
    plugins: [react()],
    test: {
        include: ["test/**/*.test.{js,jsx}"],
        // The golden run plays two whole lives
        testTimeout: 120000,
    },
})

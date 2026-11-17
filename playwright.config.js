import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
    testDir: "test/e2e",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? "github" : "list",
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ],
    webServer: [
        {
            // The game from source, for the page-text test
            command: "npx vite --port 5174 --strictPort",
            url: "http://localhost:5174/progress-knight-evolved/",
            reuseExistingServer: !process.env.CI,
        },
        {
            // The game as it is published, for the built-site test
            command: "npx vite build && npx vite preview --port 4174 --strictPort",
            url: "http://localhost:4174/progress-knight-evolved/",
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
    ],
})

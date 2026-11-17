import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
    // The game is published at https://a-crawley.github.io/progress-knight-evolved/
    base: "/progress-knight-evolved/",
    plugins: [react()],
    build: {
        rollupOptions: {
            // react.html: the React version of the page, while it's built
            input: ["index.html", "react.html"],
        },
    },
})

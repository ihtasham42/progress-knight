// The built game (npm run build), served under /progress-knight-evolved/ as
// on GitHub Pages: it loads with its styles, runs on its own timers and
// loads an existing save.

import { test, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

const SITE_URL = "http://localhost:4174/progress-knight-evolved/"
const LEGACY_SAVE = fs.readFileSync(path.join(import.meta.dirname, "..", "fixtures", "legacy-save.json"), "utf8")

async function openSite(page) {
    const errors = []
    page.on("pageerror", error => errors.push(error.message))
    page.on("console", message => {
        // The blocked Discord icon is reported as a failed load
        if (message.type() == "error" && !message.text().includes("net::ERR_FAILED")) errors.push(message.text())
    })
    // Only the game's own files; nothing from other sites
    await page.route("**/*", route => {
        return new URL(route.request().url()).hostname == "localhost" ? route.continue() : route.abort()
    })
    await page.goto(SITE_URL)
    return errors
}

test("the built game loads, styles the page and runs", async ({ page }) => {
    const errors = await openSite(page)
    await expect(page.locator("#ageDisplay")).toHaveText("14")
    // dark.css and w3.css are applied
    await expect(page.locator("#body")).toHaveClass(/dark/)
    expect(await page.locator(".w3-button").first().evaluate(element => getComputedStyle(element).cursor)).toBe("pointer")
    // The game's timers, kept by a worker so they keep going in a
    // background tab, advance the days, which are rendered
    await expect(page.locator("#dayDisplay")).not.toHaveText("0", { timeout: 5000 })
    expect(page.workers().map(worker => new URL(worker.url()).pathname)).toEqual([
        expect.stringMatching(/^\/progress-knight-evolved\/assets\/backgroundTimer\.worker-.*\.js$/),
    ])
    expect(errors).toEqual([])
})

test("the built game loads a save from the original game", async ({ page }) => {
    await page.addInitScript(save => {
        if (!sessionStorage.getItem("seeded")) {
            localStorage.setItem("gameDataSave", save)
            sessionStorage.setItem("seeded", "1")
        }
    }, LEGACY_SAVE)
    const errors = await openSite(page)
    await expect(page.locator("#quickTaskDisplay .job .name")).toHaveText(/^Fisherman/)
    await expect(page.locator("#evilDisplay")).toHaveText("1.0")
    expect(errors).toEqual([])
})

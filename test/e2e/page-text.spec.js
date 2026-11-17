// Plays a fixed, scripted game in a real browser and compares what the page
// shows (its visible text) at several points with a recording. Any change to
// the page's text or to what is shown or hidden fails this test, so the page
// can be rebuilt with confidence that it still looks the same to the player.
//
// The game's timers are switched off; the test runs the game steps and the
// renders itself, so every run is identical.
//
// To re-record (only when the page is meant to change):
//   UPDATE_PAGE_TEXT=1 npm run test:e2e

import { test, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

const ROOT = path.join(import.meta.dirname, "..", "..")
const FIXTURE = path.join(ROOT, "test", "fixtures", "page-text.json")
const ORIGIN = "http://game.test"

// Serves the game's files straight from the repository; anything else
// (e.g. the Discord icon) is blocked so the run never needs the network.
async function serveGame(page) {
    await page.route("**/*", route => {
        const url = new URL(route.request().url())
        if (url.origin != ORIGIN) return route.abort()
        const file = path.join(ROOT, decodeURIComponent(url.pathname))
        if (!file.startsWith(ROOT) || !fs.existsSync(file)) return route.fulfill({ status: 404 })
        return route.fulfill({ path: file })
    })
}

// Stops the game's own timers before any game script runs. They are made
// read-only so HackTimer can't replace them either.
function stopTimers() {
    for (const name of ["setInterval", "requestAnimationFrame"]) {
        Object.defineProperty(window, name, { value: () => 0, writable: false, configurable: false })
    }
}

// Gives the test the game functions it drives, as window.pk
async function exposeGame(page) {
    await page.evaluate(`window.pk = {
        get gameData() { return gameData },
        update, updateUI, setAutoPromote, setAutoLearn, setSkillWithLowestMaxXp,
        setProperty, setMisc, rebirthOne, rebirthTwo, getLifespan, daysToYears,
    }`)
}

// Runs game steps the way the timers would, including the once-a-second
// auto-learn choice, without rendering
async function play(page, ticks) {
    await page.evaluate(ticks => {
        for (let i = 0; i < ticks; i++) {
            if (i % 20 == 0) window.pk.setSkillWithLowestMaxXp()
            window.pk.update()
        }
    }, ticks)
}

async function render(page) {
    await page.evaluate(() => window.pk.updateUI())
}

async function pageText(page) {
    return page.evaluate(() => document.body.innerText)
}

test("the page shows exactly the recorded text through a scripted game", async ({ page }) => {
    await serveGame(page)
    await page.addInitScript(stopTimers)
    await page.goto(ORIGIN + "/index.html")
    await exposeGame(page)

    const checkpoints = []
    const record = async name => checkpoints.push({ name, text: await pageText(page) })

    await page.evaluate(() => { window.pk.setAutoPromote(true); window.pk.setAutoLearn(true) })
    await play(page, 3000)
    await render(page)
    await record("3000 ticks with auto-promote and auto-learn")

    await page.evaluate(() => { window.pk.setProperty("Tent"); window.pk.setMisc("Book") })
    await play(page, 6500)
    await render(page)
    await record("6500 more ticks with a Tent and a Book")

    await page.evaluate(() => {
        while (window.pk.daysToYears(window.pk.gameData.days) < 26) window.pk.update()
    })
    await render(page)
    await page.click("#rebirthTabButton")
    await record("age 26 with the Amulet tab open")

    await page.evaluate(() => window.pk.rebirthOne())
    await play(page, 2000)
    await render(page)
    await record("touched the eye, then 2000 ticks")

    await page.evaluate(() => { window.pk.gameData.days = window.pk.getLifespan() - 1 })
    await play(page, 20)
    await render(page)
    await page.click("#rebirthTabButton")
    await record("one day before the lifespan, then 20 ticks, on the Amulet tab")

    await page.evaluate(() => window.pk.rebirthTwo())
    await render(page)
    await page.getByText("Skills", { exact: true }).click()
    await play(page, 1500)
    await render(page)
    await record("embraced evil, then 1500 ticks on the Skills tab")

    if (process.env.UPDATE_PAGE_TEXT) {
        fs.writeFileSync(FIXTURE, JSON.stringify(checkpoints, null, 2) + "\n")
        return
    }
    const recorded = JSON.parse(fs.readFileSync(FIXTURE, "utf8"))
    expect(checkpoints.map(c => c.name)).toEqual(recorded.map(c => c.name))
    for (let i = 0; i < recorded.length; i++) {
        expect(checkpoints[i].text, recorded[i].name).toBe(recorded[i].text)
    }
})

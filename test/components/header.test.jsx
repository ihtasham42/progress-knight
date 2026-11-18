// @vitest-environment jsdom

// The header from tablet width up: age and date, the life bar, the game speed,
// the pause button and the death text.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const byId = id => document.getElementById(id)
const text = id => byId(id).textContent.replace(/\s+/g, " ").trim()
const squash = element => element.textContent.replace(/\s+/g, " ").trim()
const isHidden = id => byId(id).classList.contains("hidden")

test("age, date and years left", async () => {
    const game = await renderComponent("Header.tsx", "Header")
    assert.equal(text("ageDisplay"), "14")
    assert.equal(text("dateDisplay"), "Summer 1, 1200")
    assert.equal(document.querySelector(".life-date .season-icon").dataset.season, "summer")
    assert.equal(text("lifespanDisplay"), "70")
    game.gameData.days = 365 * 31 + 204.5
    game.rerender()
    assert.equal(squash(document.querySelector(".life-age")), "Age 31 · Winter 22, 1217")
    assert.equal(document.querySelector(".life-date .season-icon").dataset.season, "winter")
    assert.equal(squash(document.querySelector(".life-left")), "39 years left of 70")
})

test("the life bar shows the progress from age 14 to the lifespan", async () => {
    const game = await renderComponent("Header.tsx", "Header")
    const bar = document.querySelector(".life-bar")
    assert.equal(bar.getAttribute("role"), "img")
    game.gameData.days = 365 * 42
    game.rerender()
    assert.equal(bar.getAttribute("aria-label"), "Life progress: age 42 of 70")
    assert.equal(bar.firstChild.style.getPropertyValue("--fill"), "0.5")
})

test("the game speed, and Paused while paused", async () => {
    const game = await renderComponent("Header.tsx", "Header")
    assert.equal(squash(document.querySelector(".speed-text")), "4 days / sec")
    game.engine.setPause()
    game.rerender()
    assert.equal(squash(document.querySelector(".speed-text")), "Paused")
})

test("the pause button pauses and plays", async () => {
    const game = await renderComponent("Header.tsx", "Header")
    assert.equal(text("pauseButton"), "Pause")
    fireEvent.click(byId("pauseButton"))
    assert.equal(game.gameData.paused, true)
    assert.equal(text("pauseButton"), "Play")
    fireEvent.click(byId("pauseButton"))
    assert.equal(game.gameData.paused, false)
})

test("the death text is shown once age reaches the lifespan, and hidden after a rebirth", async () => {
    const game = await renderComponent("Header.tsx", "Header")
    assert.ok(isHidden("deathText"))
    game.gameData.days = 365 * 70
    game.rerender()
    assert.ok(!isHidden("deathText"))
    assert.match(text("deathText"), /^Age has caught up to you\s*Your age has met your lifespan/)
    game.engine.rebirthOne()
    game.rerender()
    assert.ok(isHidden("deathText"))
})

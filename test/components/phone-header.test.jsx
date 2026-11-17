// @vitest-environment jsdom

// The compact header shown on phones: coins, net per day, age and day, the
// life bar and the pause button.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const squash = element => element.textContent.replace(/\s+/g, " ").trim()
const header = () => document.querySelector(".phone-header")

test("coins, net per day, age and day", async () => {
    const game = await renderComponent("PhoneHeader.tsx", "PhoneHeader")
    game.gameData.coins = 123456789
    game.gameData.days = 365 * 31 + 204.5
    game.rerender()
    assert.equal(squash(header().querySelector(".phone-header-coins")), "123p 45g 67s 89c")
    assert.equal(squash(header().querySelector(".phone-header-net")), "+ 5c / day")
    assert.equal(header().querySelector(".phone-header-net span").style.color, "var(--pk-gain)")
    assert.match(squash(header().querySelector(".phone-header-muted")), /^Age 31 · Day 204\s?Lifespan 70$/)
})

test("the net sign turns to a minus when expenses are higher", async () => {
    const game = await renderComponent("PhoneHeader.tsx", "PhoneHeader")
    game.engine.setProperty("Tent")
    game.rerender()
    const sign = header().querySelector(".phone-header-net span")
    assert.equal(sign.textContent, "-")
    assert.equal(sign.style.color, "var(--pk-loss)")
})

test("the life bar shows the progress from age 14 to the lifespan", async () => {
    const game = await renderComponent("PhoneHeader.tsx", "PhoneHeader")
    const bar = header().querySelector(".life-bar")
    game.gameData.days = 365 * 10
    game.rerender()
    assert.equal(bar.firstChild.style.getPropertyValue("--fill"), "0")
    game.gameData.days = 365 * 42
    game.rerender()
    assert.equal(bar.getAttribute("aria-label"), "Age 42 of 70")
    assert.equal(bar.firstChild.style.getPropertyValue("--fill"), "0.5")
})

test("the pause button pauses and resumes the game", async () => {
    const game = await renderComponent("PhoneHeader.tsx", "PhoneHeader")
    fireEvent.click(header().querySelector("button[aria-label='Pause']"))
    assert.equal(game.gameData.paused, true)
    fireEvent.click(header().querySelector("button[aria-label='Play']"))
    assert.equal(game.gameData.paused, false)
})

test("the death message appears only when the life is over", async () => {
    const game = await renderComponent("PhoneHeader.tsx", "PhoneHeader")
    assert.equal(header().querySelector(".phone-header-death"), null)
    game.gameData.days = 365 * 70
    game.rerender()
    assert.equal(squash(header().querySelector(".phone-header-death")), "Age has caught up to you")
})

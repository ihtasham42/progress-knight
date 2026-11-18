// @vitest-environment jsdom

// The Almanac in the sidebar: today's date, the days to the next season, the
// season's bar and the way to the Chronicle.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent, screen } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const YEAR = 365
const card = () => document.getElementById("almanac")
const squash = element => element.textContent.replace(/\s+/g, " ").trim()

test("the Almanac is out of sight until the Amulet tab appears", async () => {
    const game = await renderComponent("Almanac.tsx", "Almanac", { onOpenChronicle() {} })
    assert.ok(card().classList.contains("hidden"))
    game.gameData.days = 25 * YEAR
    game.ticks(1)
    assert.ok(!card().classList.contains("hidden"))
})

test("once a life has been lived it stays, though the Amulet tab hides again", async () => {
    const game = await renderComponent("Almanac.tsx", "Almanac", { onOpenChronicle() {} })
    game.engine.rebirthOne()
    game.ticks(1)
    assert.ok(!game.engine.isUnlocked("rebirth_tab"))
    assert.ok(!card().classList.contains("hidden"))
})

test("today's date, the days to the next season and how far through this one", async () => {
    const game = await renderComponent("Almanac.tsx", "Almanac", { onOpenChronicle() {} })
    game.gameData.days = 14 * YEAR + 41.5
    game.rerender()
    assert.equal(squash(document.getElementById("almanacDate")), "Summer 42, 1200")
    assert.equal(squash(card().querySelector(".almanac-next")), "142 days to Winter")
    assert.equal(card().querySelector(".season-icon").dataset.season, "summer")
    const bar = card().querySelector(".almanac-bar")
    assert.equal(bar.getAttribute("role"), "img")
    assert.equal(bar.getAttribute("aria-label"), "Summer, day 42 of 183")
    assert.equal(bar.firstChild.style.getPropertyValue("--fill"), String(41 / 183))
    assert.equal(bar.firstChild.style.backgroundColor, "var(--pk-season-summer)")

    game.gameData.days = 14 * YEAR + 364
    game.rerender()
    assert.equal(squash(document.getElementById("almanacDate")), "Winter 182, 1200")
    assert.equal(squash(card().querySelector(".almanac-next")), "1 day to Summer")
    assert.equal(card().querySelector(".almanac-bar").getAttribute("aria-label"), "Winter, day 182 of 182")
    assert.equal(card().querySelector(".almanac-bar").firstChild.style.backgroundColor, "var(--pk-season-winter)")
})

test("the link asks for the Chronicle", async () => {
    let opened = 0
    await renderComponent("Almanac.tsx", "Almanac", { onOpenChronicle() { opened++ } })
    fireEvent.click(screen.getByRole("button", { name: "Chronicle in Settings" }))
    assert.equal(opened, 1)
})

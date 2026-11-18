// @vitest-environment jsdom

// The Chronicle in the Settings tab: every life on the world's calendar, as
// an overview on one axis and a list with a strip of seasons per life.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent, screen } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"
import { getStripStyle, getTicks } from "../../src/ui/Chronicle.tsx"

const YEAR = 365
const section = () => document.getElementById("chronicle")
const squash = element => element.textContent.replace(/\s+/g, " ").trim()
// A row's parts, one after another
const parts = row => [...row.querySelectorAll(":scope > *, :scope > .chronicle-title > *")]
    .filter(part => !part.classList.contains("chronicle-title")).map(squash).filter(Boolean).join(" ")
const lifeRows = () => [...section().querySelectorAll(".chronicle-life")].map(parts)
const gapRows = () => [...section().querySelectorAll(".chronicle-gap")].map(parts)

// Lives that end at these ages, then a living one at 32
async function withLives(ages, { evilAt = [] } = {}) {
    const game = await renderComponent("Chronicle.tsx", "Chronicle")
    for (const age of ages) {
        game.gameData.days = age * YEAR
        evilAt.includes(age) ? game.engine.rebirthTwo() : game.engine.rebirthOne()
    }
    game.gameData.days = 32 * YEAR + 100
    game.rerender()
    return game
}

test("a new game has no Chronicle until the Amulet tab appears", async () => {
    const game = await renderComponent("Chronicle.tsx", "Chronicle")
    assert.equal(section(), null)
    game.gameData.days = 25 * YEAR
    game.ticks(1)
    assert.ok(section())
    assert.equal(squash(section().querySelector(".chronicle-summary")), "1 life · 1200 to now · 11 years")
})

test("the summary, and the newest three lives with the years spent growing up between them", async () => {
    await withLives([41, 70, 52, 66, 82], { evilAt: [52] })
    assert.equal(squash(screen.getByRole("heading", { name: "Chronicle" })), "Chronicle")
    // Lives wake in 1200, 1241, 1311, 1363 and 1429; this one in 1511
    assert.equal(squash(section().querySelector(".chronicle-summary")), "6 lives · 1200 to now · 329 years")
    assert.deepEqual(lifeRows(), [
        "Life 6 · now Born 1497 · living, age 32 1511–now",
        "Life 5 Born 1415 · touched the eye at 82 1429–1497",
        "Life 4 Born 1349 · touched the eye at 66 1363–1415",
    ])
    assert.deepEqual(gapRows(), ["Growing up 1497–1511", "Growing up 1415–1429"])
    assert.ok(section().querySelector(".chronicle-life .chronicle-years-now"))

    const more = screen.getByRole("button", { name: "Show all 6 lives" })
    assert.equal(more.getAttribute("aria-expanded"), "false")
    fireEvent.click(more)
    assert.equal(lifeRows().length, 6)
    assert.equal(lifeRows()[3], "Life 3 Born 1297 · embraced evil at 52 1311–1349")
    assert.equal(lifeRows()[5], "Life 1 Born 1186 · touched the eye at 41 1200–1227")
    assert.equal(gapRows().length, 5)
    fireEvent.click(screen.getByRole("button", { name: "Show recent lives" }))
    assert.equal(lifeRows().length, 3)
})

test("the life being lived updates as time passes", async () => {
    const game = await withLives([70])
    assert.match(lifeRows()[0], /living, age 32 1270–now$/)
    game.gameData.days = 40 * YEAR
    game.rerender()
    assert.match(lifeRows()[0], /living, age 40 1270–now$/)
    assert.equal(squash(section().querySelector(".chronicle-summary")), "2 lives · 1200 to now · 96 years")
})

test("the overview puts every life on one axis, with the century and now", async () => {
    await withLives([41, 70, 52])
    const axis = section().querySelector(".chronicle-axis")
    assert.equal(axis.getAttribute("role"), "img")
    assert.equal(axis.getAttribute("aria-label"), "4 lives from 1200 to now")
    const blocks = [...axis.querySelectorAll(".chronicle-block")]
    assert.deepEqual(blocks.map(block => block.textContent), ["I", "II", "III", "IV"])
    assert.ok(blocks[3].classList.contains("chronicle-block-now"))
    assert.equal(blocks[0].style.left, "0%")
    assert.equal(blocks[1].title, "Life II, 1241–1297")
    assert.ok(parseFloat(axis.querySelector(".chronicle-now").style.left) < 100)
    assert.deepEqual([...section().querySelectorAll(".chronicle-ticks span")].map(tick => tick.textContent), ["1200", "1300"])
    assert.deepEqual([...section().querySelectorAll(".chronicle-legend > span")].map(squash), ["Summer", "Winter"])
})

test("lives that overlap are stacked in rows", async () => {
    const game = await withLives([70])
    game.gameData.lives[0].born = 40 * YEAR
    game.gameData.lives[0].ended = 96 * YEAR
    game.rerender()
    const axis = section().querySelector(".chronicle-axis")
    assert.equal(axis.style.getPropertyValue("--rows"), "2")
    assert.deepEqual([...axis.querySelectorAll(".chronicle-block")].map(block => block.style.getPropertyValue("--row")), ["0", "1"])
})

test("axis labels space out over long histories, and narrow lives drop their numerals", async () => {
    assert.deepEqual(getTicks(0, 340 * YEAR).map(tick => tick.year), [1200, 1300, 1400, 1500])
    assert.deepEqual(getTicks(0, 3000 * YEAR).map(tick => tick.year), [1500, 2000, 2500, 3000, 3500])
    assert.deepEqual(getTicks(0, 6000 * YEAR).map(tick => tick.year), [2000, 3000, 4000, 5000, 6000])
    for (const span of [10, 340, 3000, 60000, 6e6]) assert.ok(getTicks(0, span * YEAR).length <= 6, String(span))

    const game = await withLives(Array.from({ length: 55 }, (_, i) => 40 + (i * 7) % 160))
    const blocks = [...section().querySelectorAll(".chronicle-block")]
    assert.equal(blocks.length, 51)
    assert.ok(blocks.some(block => block.textContent == ""), "narrow blocks leave out their numeral")
    assert.match(squash(section().querySelector(".chronicle-summary")), /^51 lives · \d+ to now · \d+ years$/)
    assert.equal(game.errors?.length ?? 0, 0)
})

test("each strip starts on the right day of the year", async () => {
    // Waking on Winter 1: the strip starts half a year into the pattern
    const style = getStripStyle(183, 183 + 2 * YEAR)
    assert.equal(style.backgroundImage, "repeating-linear-gradient(90deg, "
        + "var(--pk-stripe-summer) -25.0685%, var(--pk-stripe-summer) 0.0000%, "
        + "var(--pk-stripe-winter) 0.0000%, var(--pk-stripe-winter) 24.9315%)")
    await withLives([41])
    const strip = section().querySelector(".chronicle-strip")
    assert.equal(strip.getAttribute("role"), "img")
    assert.equal(strip.getAttribute("aria-label"), "18 years of Summers and Winters")
})

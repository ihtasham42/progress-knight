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

test("the summary, and the newest three lives, each woken in 1200", async () => {
    await withLives([41, 70, 52, 66, 82], { evilAt: [52] })
    assert.equal(squash(screen.getByRole("heading", { name: "Chronicle" })), "Chronicle")
    // This life is 32, so it is 1218
    assert.equal(squash(section().querySelector(".chronicle-summary")), "6 lives · 1200 to now · 18 years")
    assert.deepEqual(lifeRows(), [
        "Life 6 · now Born 1186 · living, age 32 1200–now",
        "Life 5 Born 1186 · touched the eye at 82 1200–1268",
        "Life 4 Born 1186 · touched the eye at 66 1200–1252",
    ])
    assert.equal(section().querySelector(".chronicle-gap"), null, "no years between lives")
    assert.ok(section().querySelector(".chronicle-life .chronicle-years-now"))

    const more = screen.getByRole("button", { name: "Show all 6 lives" })
    assert.equal(more.getAttribute("aria-expanded"), "false")
    fireEvent.click(more)
    assert.equal(lifeRows().length, 6)
    assert.equal(lifeRows()[3], "Life 3 Born 1186 · embraced evil at 52 1200–1238")
    assert.equal(lifeRows()[5], "Life 1 Born 1186 · touched the eye at 41 1200–1227")
    fireEvent.click(screen.getByRole("button", { name: "Show recent lives" }))
    assert.equal(lifeRows().length, 3)
})

test("the life being lived updates as time passes", async () => {
    const game = await withLives([70])
    assert.match(lifeRows()[0], /living, age 32 1200–now$/)
    game.gameData.days = 40 * YEAR
    game.rerender()
    assert.match(lifeRows()[0], /living, age 40 1200–now$/)
    assert.equal(squash(section().querySelector(".chronicle-summary")), "2 lives · 1200 to now · 26 years")
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
    assert.ok(blocks.every(block => block.style.left == "0%"), "every life starts in 1200")
    assert.equal(blocks[1].title, "Life II, 1200–1256")
    assert.ok(parseFloat(axis.querySelector(".chronicle-now").style.left) < 100)
    assert.deepEqual([...section().querySelectorAll(".chronicle-ticks span")].map(tick => tick.textContent), ["1200"])
    assert.deepEqual([...section().querySelectorAll(".chronicle-legend > span")].map(squash), ["Summer", "Winter"])
})

test("lives share their start, so each is stacked in a row of its own", async () => {
    await withLives([70])
    const axis = section().querySelector(".chronicle-axis")
    assert.equal(axis.style.getPropertyValue("--rows"), "2")
    assert.deepEqual([...axis.querySelectorAll(".chronicle-block")].map(block => block.style.getPropertyValue("--row")), ["0", "1"])
})

test("axis labels space out over long histories, and narrow lives drop their numerals", async () => {
    assert.deepEqual(getTicks(0, 340 * YEAR).map(tick => tick.year), [1200, 1300, 1400, 1500])
    assert.deepEqual(getTicks(0, 3000 * YEAR).map(tick => tick.year), [1500, 2000, 2500, 3000, 3500])
    assert.deepEqual(getTicks(0, 6000 * YEAR).map(tick => tick.year), [2000, 3000, 4000, 5000, 6000])
    for (const span of [10, 340, 3000, 60000, 6e6]) assert.ok(getTicks(0, span * YEAR).length <= 6, String(span))

    const game = await withLives([...Array.from({ length: 54 }, (_, i) => 40 + (i * 7) % 160), 15])
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
    const strip = section().querySelector(".chronicle-track")
    assert.equal(strip.getAttribute("role"), "img")
    assert.equal(strip.getAttribute("aria-label"), "18 years of Summers and Winters")
})

const unlock = (game, ...names) => { for (const name of names) game.gameData.requirements[name].completed = true }

test("each life marks the events it lived through, rare ones in gold, and names them", async () => {
    const game = await withLives([70])
    // Life 1 woke in 1200 and touched the eye at 70, in 1256
    assert.equal(section().querySelector(".chronicle-lane"), null, "no events before they are unlocked")
    assert.equal(section().querySelector(".chronicle-events"), null)
    assert.deepEqual([...section().querySelectorAll(".chronicle-legend > span")].map(squash), ["Summer", "Winter"])

    unlock(game, "Shop", "Arcane glimpse")
    game.rerender()
    const [, first] = section().querySelectorAll(".chronicle-life")
    assert.equal(squash(first.querySelector(".chronicle-events")),
        "Arcane Conjunction 1200, 1207, 1214, 1221, 1228, 1235, 1242, 1249 · 12 Hard Winters")
    const marks = [...first.querySelectorAll(".chronicle-event")]
    assert.equal(marks.length, 8 + 12)
    assert.equal(marks.filter(mark => mark.classList.contains("chronicle-rare")).length, 8)
    // The first, Hard Winter 1200, runs from day 183 to 365 of a 56-year life
    assert.equal(marks[0].style.left, 183 / (56 * 365) * 100 + "%")
    assert.equal(first.querySelector(".chronicle-track").getAttribute("aria-label"), "56 years of Summers and Winters, 20 events")
    assert.deepEqual([...section().querySelectorAll(".chronicle-legend > span")].map(squash),
        ["Summer", "Winter", "Event (a season)", "Rare event"])
})

test("the life being lived counts the events that have begun, one alone by name", async () => {
    const game = await renderComponent("Chronicle.tsx", "Chronicle")
    unlock(game, "Shop")
    game.gameData.days = 25 * 365
    game.ticks(1)
    // 1200 to 1211: Hard Winters in 1200, 1205 and 1210
    assert.equal(squash(section().querySelector(".chronicle-events")), "3 Hard Winters")
    game.gameData.days = 14 * 365 + 200
    game.rerender()
    assert.equal(squash(section().querySelector(".chronicle-events")), "Hard Winter")
})

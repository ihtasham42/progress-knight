// Number and coin formatting used throughout the UI.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadGame } from "./helpers/game.js"

const game = loadGame()
const format = game.window.format

test("numbers below 1000 are shown as-is", () => {
    assert.equal(format(0), 0)
    assert.equal(format(5), 5)
    assert.equal(format(999), 999)
    assert.equal(format(0.5), 0.5)
})

test("larger numbers use suffixes with one decimal place", () => {
    assert.equal(format(1000), "1.0k")
    assert.equal(format(1500), "1.5k")
    assert.equal(format(999949), "999.9k")
    assert.equal(format(2.5e6), "2.5M")
    assert.equal(format(1e27), "1.0Oc")
})

test("rounding up never shows 1000 of a suffix", () => {
    assert.equal(format(999950), "1.0M")
})

test("negative numbers and numeric strings are formatted too", () => {
    assert.equal(format(-2500), "-2.5k")
    assert.equal(format("12345"), "12.3k")
})

test("numbers beyond the last suffix use scientific notation", () => {
    assert.equal(format(1e30), "1.00e+30")
    assert.equal(format(2.5e40), "2.50e+40")
    assert.equal(format(Infinity), "Infinity")
})

function coinText(coins) {
    const element = game.window.document.createElement("span")
    for (let i = 0; i < 4; i++) element.appendChild(game.window.document.createElement("span"))
    game.window.formatCoins(coins, element)
    return [...element.children].map(child => child.textContent).join("").trim()
}

test("coins are split into platinum, gold, silver and copper (100 of each per next)", () => {
    assert.equal(coinText(123456789), "123p 45g 67s 89c")
    assert.equal(coinText(5), "5c")
    assert.equal(coinText(0), "0c")
})

test("empty coin tiers are hidden", () => {
    assert.equal(coinText(100), "1s")
    assert.equal(coinText(1000001), "1p 1c")
})

test("very large platinum amounts are abbreviated", () => {
    assert.equal(coinText(5e12), "5.0Mp")
})

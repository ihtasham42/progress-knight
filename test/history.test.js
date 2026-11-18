// The world's history: lives as spans of world days, for the Chronicle and
// the past lives table.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadEngine } from "./helpers/engine.js"
import { assignRows, toRoman } from "../src/game/history.ts"

const YEAR = 365

test("a new game's history is the life being lived, woken on day 0", async () => {
    const game = await loadEngine()
    const [span] = game.api.getLifeSpans()
    assert.equal(game.api.getLifeSpans().length, 1)
    assert.equal(span.life, 1)
    assert.equal(span.living, true)
    assert.equal(span.end, null)
    assert.equal(span.born, -14 * YEAR)
    assert.equal(span.woke, 0)
    assert.equal(span.ended, game.api.getWorldDay())
    assert.equal(span.row, 0)
})

test("every life wakes on the same day and ends where its age took it", async () => {
    const game = await loadEngine()
    const { gameData } = game
    gameData.days = 66 * YEAR
    game.api.rebirthOne()
    gameData.days = 41 * YEAR
    game.api.rebirthTwo()
    gameData.days = 20 * YEAR
    const spans = game.api.getLifeSpans()
    assert.deepEqual(spans.map(span => [span.life, span.end, span.age, span.living, span.row]),
        [[1, "rebirth", 66, false, 0], [2, "evil", 41, false, 1], [3, null, 20, true, 2]])
    assert.deepEqual(spans.map(span => [span.born / YEAR, span.woke / YEAR, span.ended / YEAR]), [[-14, 0, 52], [-14, 0, 27], [-14, 0, 6]])
    assert.equal(game.api.yearOf(spans[2].ended), 1206)
    assert.equal(game.api.nextWakeDay(), 0, "the next life wakes on the same day")
})

test("lives are ordered by date, and overlapping ones get rows of their own", async () => {
    const spans = assignRows([
        { woke: 0, ended: 50, row: 0 },
        { woke: 30, ended: 60, row: 0 },
        { woke: 50, ended: 70, row: 0 },
        { woke: 55, ended: 58, row: 0 },
        { woke: 100, ended: 120, row: 0 },
    ])
    assert.deepEqual(spans.map(span => span.row), [0, 1, 0, 2, 0])
})

test("the history copes with fifty lives", async () => {
    const game = await loadEngine()
    const { gameData } = game
    for (let i = 0; i < 60; i++) {
        gameData.days = (60 + i) * YEAR
        game.api.rebirthOne()
    }
    const spans = game.api.getLifeSpans()
    assert.equal(spans.length, 51)
    assert.equal(spans[0].life, 11)
    assert.equal(spans[50].life, 61)
    assert.deepEqual(spans.map(span => span.row), Array.from({ length: 51 }, (_, i) => i), "every life shares the start")
    assert.equal(game.api.yearOf(spans[49].ended), 1305, "life 60 touched the eye at 119")
})

test("Roman numerals", async () => {
    assert.deepEqual([1, 4, 6, 9, 14, 40, 49, 50, 90, 400, 1994].map(toRoman),
        ["I", "IV", "VI", "IX", "XIV", "XL", "XLIX", "L", "XC", "CD", "MCMXCIV"])
})

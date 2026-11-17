// The game loop measures real time and runs one fixed game step for every
// 1/20 of a second that has passed, catching up on at most MAX_CATCH_UP_MS.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadEngine } from "./helpers/engine.js"

function snapshot(game) {
    const gameData = game.api.gameData
    return JSON.stringify({
        days: gameData.days,
        coins: gameData.coins,
        tasks: Object.values(gameData.taskData).map(task => [task.level, task.xp]),
    })
}

test("a second of real time runs exactly the same 20 steps as before", async () => {
    const timed = await loadEngine()
    const stepped = await loadEngine()
    assert.equal(timed.api.advanceGameTime(1000), 20)
    stepped.fastTicks(20)
    assert.equal(snapshot(timed), snapshot(stepped))
})

test("time that doesn't fill a whole step is kept for the next call", async () => {
    const game = await loadEngine()
    assert.equal(game.api.advanceGameTime(30), 0)
    assert.equal(game.api.advanceGameTime(30), 1)
    assert.equal(game.api.advanceGameTime(40), 1)
    assert.equal(game.api.advanceGameTime(0), 0)
})

test("late timers are caught up on", async () => {
    const game = await loadEngine()
    assert.equal(game.api.advanceGameTime(5000), 100)
})

test("catching up stops at MAX_CATCH_UP_MS and the rest of a long gap is dropped", async () => {
    const game = await loadEngine()
    assert.equal(game.api.MAX_CATCH_UP_MS, 20000)
    assert.equal(game.api.advanceGameTime(game.api.MAX_CATCH_UP_MS), 400)
    assert.equal(game.api.advanceGameTime(60 * 60 * 1000), 400)
    assert.equal(game.api.advanceGameTime(49), 0, "nothing is left over from the dropped time")
    assert.equal(game.api.advanceGameTime(1), 1)
})

test("time going backwards runs no steps", async () => {
    const game = await loadEngine()
    assert.equal(game.api.advanceGameTime(-1000), 0)
    assert.equal(game.api.advanceGameTime(50), 1)
})

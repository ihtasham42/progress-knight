// The history of past lives: what each rebirth records.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadEngine } from "./helpers/engine.js"

test("touching the eye records the life that ends", async () => {
    const game = await loadEngine()
    const { gameData } = game
    game.api.getTaskById("farmer").level = 12
    game.api.getTaskById("beggar").level = 30
    game.api.getTaskById("strength").level = 40
    game.api.getTaskById("concentration").level = 15
    gameData.days = 365 * 66 + 10
    gameData.coins = 1234
    gameData.lifePeakCoins = 5000
    game.api.rebirthOne()

    assert.deepEqual(JSON.parse(JSON.stringify(gameData.lives)), [{
        life: 1, end: "rebirth", age: 66,
        job: { id: "beggar", level: 30 }, skill: { id: "strength", level: 40 },
        peakCoins: 5000, evil: 0,
        born: -365 * 14, ended: 365 * 52 + 10,
    }])
    assert.equal(gameData.lifePeakCoins, 0, "the next life starts its own peak")
    assert.equal(gameData.rebirthOneCount, 1)
})

test("embracing evil records the evil gained, and lives count across both rebirths", async () => {
    const game = await loadEngine()
    const { gameData } = game
    game.api.rebirthOne()
    game.api.getTaskById("evil_control").level = 100
    game.api.getTaskById("blood_meditation").level = 50
    gameData.days = 365 * 200
    game.api.rebirthTwo()
    game.api.rebirthOne()

    const lives = gameData.lives
    assert.deepEqual(Array.from(lives, life => [life.life, life.end]), [[1, "rebirth"], [2, "evil"], [3, "rebirth"]])
    assert.equal(lives[1].age, 200)
    assert.equal(lives[1].evil, 3)
    assert.equal(gameData.evil, 3, "the rebirth itself works as before")
    assert.equal(lives[2].evil, 0)
})

test("the peak purse follows the coins during a life and counts coins held at the end", async () => {
    const game = await loadEngine()
    const { gameData } = game
    gameData.coins = 900
    game.fastTicks(1)
    assert.ok(gameData.lifePeakCoins >= 900)
    const peak = gameData.lifePeakCoins
    gameData.coins = 10 // spent, e.g. on items
    game.fastTicks(1)
    assert.equal(gameData.lifePeakCoins, peak, "spending doesn't lower the peak")

    gameData.coins = peak + 7000 // earned since the last step
    game.api.rebirthOne()
    assert.equal(gameData.lives[0].peakCoins, peak + 7000)
    assert.equal(gameData.coins, 0)
})

test("the best job and skill are the highest levels of this life, and start from the first job and skill", async () => {
    const game = await loadEngine()
    game.api.rebirthOne()
    const [life] = game.gameData.lives
    assert.deepEqual(JSON.parse(JSON.stringify([life.job, life.skill])), [{ id: "beggar", level: 0 }, { id: "concentration", level: 0 }])
})

test("only the last 50 lives are kept", async () => {
    const game = await loadEngine()
    for (let i = 0; i < 53; i++) i % 2 ? game.api.rebirthTwo() : game.api.rebirthOne()
    const lives = game.gameData.lives
    assert.equal(lives.length, 50)
    assert.equal(lives[0].life, 4)
    assert.equal(lives[49].life, 53)
})

test("the world date follows the age and stops at the lifespan", async () => {
    const game = await loadEngine()
    const { gameData } = game
    assert.equal(gameData.lifeStartDay, 0, "the first life wakes on world day 0")
    game.fastTicks(100)
    assert.equal(game.api.getWorldDay(), gameData.days - 365 * 14)
    assert.ok(game.api.getWorldDay() > 0)

    gameData.days = game.api.getLifespan() - 0.01
    game.fastTicks(5)
    assert.equal(gameData.days, game.api.getLifespan())
    const end = game.api.getWorldDay()
    game.fastTicks(5)
    assert.equal(game.api.getWorldDay(), end, "the date stops when the life is over")
})

test("both rebirths date the life and wake the next one 14 years after it ended", async () => {
    const game = await loadEngine()
    const { gameData } = game
    gameData.days = 365 * 40 + 100.5
    game.api.rebirthOne()
    const first = gameData.lives[0]
    assert.equal(first.born, -365 * 14)
    assert.equal(first.ended, 365 * 26 + 100.5)
    assert.equal(gameData.lifeStartDay, first.ended + 365 * 14)
    assert.equal(game.api.getWorldDay(), first.ended + 365 * 14, "the new life wakes at 14, 14 years on")

    gameData.days = 365 * 200
    game.api.rebirthTwo()
    const second = gameData.lives[1]
    assert.equal(second.born, first.ended, "born as the last life ended")
    assert.equal(second.ended - second.born, 365 * 200)
    assert.equal(game.api.getWorldDay(), second.ended + 365 * 14)
    assert.equal(game.api.formatDate(game.api.toDate(game.api.getWorldDay())), "Summer 101, 1440")
})

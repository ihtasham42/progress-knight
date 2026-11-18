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
    assert.equal(Math.floor(game.api.getWorldDay()), 0, "the first life wakes on world day 0")
    assert.equal(game.api.getWorldYear(), 1200)
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

test("both rebirths wake the next life on Summer 1, 1200", async () => {
    const game = await loadEngine()
    const { gameData } = game
    const today = () => game.api.formatDate(game.api.toDate(game.api.getWorldDay()))
    gameData.days = 365 * 40 + 100.5
    assert.equal(today(), "Summer 101, 1226")
    game.api.rebirthOne()
    assert.equal(game.api.getWorldDay(), 0)
    assert.equal(today(), "Summer 1, 1200", "after touching the eye")

    gameData.days = 365 * 200
    game.api.rebirthTwo()
    assert.equal(today(), "Summer 1, 1200", "after embracing evil")
    assert.equal(game.api.getWorldYear(), 1200)
})

test("the furthest date any life reached is kept, survives both rebirths and never goes back", async () => {
    const game = await loadEngine()
    const { gameData } = game
    const year = () => game.api.yearOf(game.api.getFurthestDay())
    game.fastTicks(1)
    assert.ok(gameData.furthestDay > 0, "it follows the life being lived")

    gameData.days = 365 * 70
    game.fastTicks(1)
    game.api.rebirthOne()
    assert.equal(gameData.furthestDay, 365 * 56)
    assert.equal(year(), 1256)

    gameData.days = 365 * 40
    game.api.rebirthTwo()
    assert.equal(gameData.furthestDay, 365 * 56, "a shorter life doesn't lower it")

    game.api.getTaskById("immortality").level = 33 ** 3 - 1 // lifespan x4
    gameData.days = 365 * 90
    game.fastTicks(1)
    assert.equal(year(), 1276, "a longer life raises it as it goes")
    game.api.rebirthTwo()
    assert.equal(Math.floor(gameData.furthestDay), 365 * 76)

    // Past the cap, the life that set it is long gone from the history
    for (let i = 0; i < 60; i++) game.api.rebirthOne()
    assert.equal(gameData.lives.length, 50)
    assert.ok(gameData.lives.every(life => life.age < 90))
    assert.equal(Math.floor(gameData.furthestDay), 365 * 76)
})

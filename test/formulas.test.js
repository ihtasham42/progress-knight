// Core game formulas. Expected values are worked out by hand from the
// formulas so these tests catch accidental balance changes.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadGame } from "./helpers/game.js"

test("xp needed per level grows as base * (level + 1) * 1.01^level", async () => {
    const game = await loadGame()
    const beggar = game.task("Beggar") // base max xp 50
    assert.equal(beggar.getMaxXp(), 50)
    beggar.level = 10
    assert.equal(beggar.getMaxXp(), Math.round(50 * 11 * Math.pow(1.01, 10))) // 608
    assert.equal(beggar.getMaxXp(), 608)
})

test("base xp gain is 10 per day, and the game runs at 4 days per second", async () => {
    const game = await loadGame()
    assert.equal(game.task("Beggar").getXpGain(), 10)
    assert.equal(game.task("Concentration").getXpGain(), 10)
    assert.equal(game.api.getGameSpeed(), 4)
    // 20 ticks per second, so each tick is 4 / 20 = 0.2 days and 2 xp
    assert.equal(game.api.applySpeed(10), 2)
})

test("a job levels up once it has enough xp", async () => {
    const game = await loadGame() // the game runs one tick on load
    assert.equal(game.task("Beggar").xp, 2)
    game.ticks(23)
    assert.equal(game.task("Beggar").level, 0)
    game.ticks(1) // 25 ticks * 2 xp = 50 xp = level 1
    assert.equal(game.task("Beggar").level, 1)
    assert.equal(game.task("Beggar").xp, 0)
})

test("job income is multiplied by 1 + log10(level + 1)", async () => {
    const game = await loadGame()
    const beggar = game.task("Beggar") // base income 5
    assert.equal(beggar.getIncome(), 5)
    beggar.level = 9
    assert.equal(beggar.getIncome(), 10)
    beggar.level = 99
    assert.equal(beggar.getIncome(), 15)
})

test("military pay is boosted by Strength", async () => {
    const game = await loadGame()
    game.task("Strength").level = 50
    assert.equal(game.task("Squire").getIncome(), Math.round(5 * 1.5)) // 8
    assert.equal(game.task("Farmer").getIncome(), 9) // common work isn't affected
})

test("most skills give +1% per level", async () => {
    const game = await loadGame()
    const concentration = game.task("Concentration")
    concentration.level = 50
    assert.equal(concentration.getEffect(), 1.5)
    assert.equal(concentration.getEffectDescription(), "x1.50 Skill xp")
    assert.equal(game.task("Farmer").getXpGain(), 10, "Concentration doesn't affect jobs")
})

test("Bargaining and Intimidation cut expenses on a log scale, never below x0.1", async () => {
    const game = await loadGame()
    for (const name of ["Bargaining", "Intimidation"]) {
        const skill = game.task(name)
        assert.equal(skill.getEffect(), 1)
        skill.level = 6 // log7(7) = 1
        assert.equal(skill.getEffect(), 0.9)
        skill.level = 1e12
        assert.equal(skill.getEffect(), 0.1)
        skill.level = 0
    }
})

test("Time warping speeds the game up by 1 + log13(level + 1) when enabled", async () => {
    const game = await loadGame()
    game.task("Time warping").level = 12
    assert.equal(game.task("Time warping").getEffect(), 2)
    assert.equal(game.api.getGameSpeed(), 8)
    game.api.setTimeWarping()
    assert.equal(game.api.getGameSpeed(), 4)
})

test("lifespan is 70 years, extended by Immortality and Super immortality", async () => {
    const game = await loadGame()
    assert.equal(game.api.daysToYears(game.api.getLifespan()), 70)
    game.task("Immortality").level = 32 // 1 + log33(33) = 2
    assert.equal(game.api.daysToYears(game.api.getLifespan()), 140)
    game.task("Super immortality").level = 100 // x2
    assert.equal(game.api.daysToYears(game.api.getLifespan()), 280)
})

test("happiness multiplies Meditation, Butler and the current property", async () => {
    const game = await loadGame()
    assert.equal(game.api.getHappiness(), 1)
    game.task("Meditation").level = 100
    game.api.setProperty('Tent')
    game.api.setMisc('Butler')
    assert.ok(Math.abs(game.api.getHappiness() - 2 * 1.5 * 1.4) < 1e-9)
    // happiness boosts every task's xp
    assert.equal(game.task("Beggar").getXpGain(), Math.round(10 * 4.2))
})

test("items only take effect while owned", async () => {
    const game = await loadGame()
    assert.equal(game.item("Book").getEffect(), 1)
    game.api.setMisc('Book')
    assert.equal(game.item("Book").getEffect(), 1.5)
    assert.equal(game.task("Concentration").getXpGain(), 15)
    game.api.setMisc('Book') // toggles off
    assert.equal(game.item("Book").getEffect(), 1)
})

test("expenses add up the property and misc items, reduced by Bargaining", async () => {
    const game = await loadGame()
    game.api.setProperty('Tent')
    game.api.setMisc('Book')
    assert.equal(game.api.getExpense(), 15 + 10)
    game.task("Bargaining").level = 6 // x0.9, each item rounded
    assert.equal(game.api.getExpense(), Math.round(15 * 0.9) + Math.round(10 * 0.9))
})

test("running out of coins makes you homeless and drops your items", async () => {
    const game = await loadGame()
    game.api.setProperty('Tent')
    game.api.setMisc('Book')
    game.ticks(1)
    assert.equal(game.gameData.coins, 0)
    assert.equal(game.gameData.currentProperty.name, "Homeless")
    assert.equal(game.gameData.currentMisc.length, 0)
})

test("evil gained on rebirth is Evil control x Blood meditation", async () => {
    const game = await loadGame()
    assert.equal(game.api.getEvilGain(), 1)
    game.task("Evil control").level = 100
    game.task("Blood meditation").level = 50
    assert.equal(game.api.getEvilGain(), 3)
})

test("time stops when paused or when lifespan is reached", async () => {
    const game = await loadGame()
    const startDays = game.gameData.days
    game.api.setPause()
    game.ticks(10)
    assert.equal(game.gameData.days, startDays)
    game.api.setPause()

    game.api.gameData.days = game.api.getLifespan()
    const coins = game.gameData.coins
    game.ticks(10)
    assert.equal(game.api.isAlive(), false)
    assert.equal(game.gameData.coins, coins)
})

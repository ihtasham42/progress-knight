import { test } from "vitest"
import assert from "node:assert/strict"
import { loadGame } from "./helpers/game.js"

test("a new game starts as a 14 year old beggar with no coins", () => {
    const game = loadGame()
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
    assert.equal(game.run("daysToYears(gameData.days)"), 14)
    assert.equal(game.gameData.currentJob.name, "Beggar")
    assert.equal(game.gameData.currentSkill.name, "Concentration")
    assert.equal(game.gameData.currentProperty.name, "Homeless")
})

test("ticking the game earns coins and xp without errors", () => {
    const game = loadGame()
    game.ticks(100)
    assert.ok(game.gameData.coins > 0)
    assert.ok(game.task("Beggar").level > 0)
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

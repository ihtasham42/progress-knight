// Unlocks, automation and both kinds of rebirth.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadGame } from "./helpers/game.js"

function isUnlocked(game, key) {
    return game.run(`gameData.requirements[${JSON.stringify(key)}].isCompleted()`)
}

test("each job needs level 10 in the previous job", () => {
    const game = loadGame()
    assert.equal(isUnlocked(game, "Beggar"), true)
    assert.equal(isUnlocked(game, "Farmer"), false)
    game.task("Beggar").level = 10
    assert.equal(isUnlocked(game, "Farmer"), true)
})

test("some jobs also need skill levels", () => {
    const game = loadGame()
    game.task("Fisherman").level = 10
    assert.equal(isUnlocked(game, "Miner"), false)
    game.task("Strength").level = 10
    assert.equal(isUnlocked(game, "Miner"), true)
})

test("The Arcane Association needs Concentration 200 and Meditation 200", () => {
    const game = loadGame()
    game.task("Concentration").level = 200
    assert.equal(isUnlocked(game, "The Arcane Association"), false)
    game.task("Meditation").level = 200
    assert.equal(isUnlocked(game, "The Arcane Association"), true)
})

test("the shop unlocks at 50 times the cost of a tent, and stays unlocked", () => {
    const game = loadGame()
    assert.equal(isUnlocked(game, "Shop"), false)
    game.run("gameData.coins = 750")
    assert.equal(isUnlocked(game, "Shop"), true)
    game.run("gameData.coins = 0")
    assert.equal(isUnlocked(game, "Shop"), true)
})

test("locked rows are hidden in the UI and appear once unlocked", () => {
    const game = loadGame()
    const farmerRow = game.window.document.getElementById("row Farmer")
    assert.ok(farmerRow.classList.contains("hidden"))
    game.task("Beggar").level = 10
    game.ticks(1)
    assert.ok(!farmerRow.classList.contains("hidden"))
})

test("auto-promote moves to the next job in the same career once unlocked", () => {
    const game = loadGame()
    game.window.document.getElementById("autoPromote").checked = true
    game.task("Beggar").level = 10
    game.ticks(1)
    assert.equal(game.gameData.currentJob.name, "Farmer")
})

test("auto-learn picks the lowest level unlocked skill that isn't skipped", () => {
    const game = loadGame()
    game.window.document.getElementById("autoLearn").checked = true
    game.task("Concentration").level = 30
    game.task("Productivity").level = 15 // keeps Meditation (needs Productivity 20) locked
    game.task("Bargaining").level = 2
    game.task("Strength").level = 1 // Battle tactics (needs Concentration 20) is still level 0
    game.run("setSkillWithLowestMaxXp()")
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Battle tactics")

    const skip = game.window.document.getElementById("row Battle tactics").getElementsByClassName("checkbox")[0]
    skip.checked = true
    game.run("setSkillWithLowestMaxXp()")
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Strength")
})

test("touching the eye resets the life but keeps max levels as an xp bonus", () => {
    const game = loadGame()
    game.task("Beggar").level = 20
    game.task("Concentration").level = 15
    game.run("gameData.coins = 1000; gameData.days = 365 * 40; setTask('Farmer'); setProperty('Tent'); setMisc('Book')")
    assert.equal(isUnlocked(game, "Shop"), true)
    assert.equal(isUnlocked(game, "Farmer"), true)

    game.run("rebirthOne()")

    const data = game.gameData
    assert.equal(data.rebirthOneCount, 1)
    assert.equal(data.coins, 0)
    assert.equal(game.run("daysToYears(gameData.days)"), 14)
    assert.equal(data.currentJob.name, "Beggar")
    assert.equal(data.currentSkill.name, "Concentration")
    assert.equal(data.currentProperty.name, "Homeless")
    assert.equal(data.currentMisc.length, 0)
    assert.equal(game.task("Beggar").level, 0)
    assert.equal(game.task("Beggar").maxLevel, 20)
    assert.equal(game.task("Beggar").getXpGain(), 10 * (1 + 20 / 10))
    assert.equal(isUnlocked(game, "Shop"), true, "the shop is a permanent unlock")
    assert.equal(isUnlocked(game, "Farmer"), false, "job unlocks have to be earned again")
})

test("a rebirth never lowers a max level", () => {
    const game = loadGame()
    game.task("Beggar").maxLevel = 50
    game.task("Beggar").level = 10
    game.run("rebirthOne()")
    assert.equal(game.task("Beggar").maxLevel, 50)
})

test("embracing evil gives evil, unlocks dark magic and also resets max levels", () => {
    const game = loadGame()
    game.task("Beggar").level = 20
    game.task("Beggar").maxLevel = 40
    assert.equal(isUnlocked(game, "Dark magic"), false)

    game.run("rebirthTwo()")

    assert.equal(game.gameData.evil, 1)
    assert.equal(game.gameData.rebirthTwoCount, 1)
    assert.equal(game.task("Beggar").maxLevel, 0)
    assert.equal(isUnlocked(game, "Dark magic"), true)
    assert.equal(isUnlocked(game, "Demon training"), false, "needs 25 evil")
})

test("dark magic skill xp is multiplied by evil", () => {
    const game = loadGame()
    game.run("gameData.evil = 5")
    assert.equal(game.task("Dark influence").getXpGain(), 50)
    assert.equal(game.task("Concentration").getXpGain(), 10)
})

test("automation and the quick task display also stay unlocked after a rebirth", () => {
    const game = loadGame()
    game.run("gameData.days = 365 * 20")
    assert.equal(isUnlocked(game, "Automation"), true)
    assert.equal(isUnlocked(game, "Quick task display"), true)
    assert.equal(isUnlocked(game, "Rebirth tab"), false)
    game.run("rebirthOne()")
    assert.equal(isUnlocked(game, "Automation"), true)
    assert.equal(isUnlocked(game, "Quick task display"), true)
})

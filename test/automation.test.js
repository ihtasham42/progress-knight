"use strict"

// Automation settings live in game state. The checkboxes only change that
// state; the game logic never reads the checkboxes.

const test = require("node:test")
const assert = require("node:assert/strict")
const { loadGame } = require("./helpers/game")

test("automation starts switched off", () => {
    const game = loadGame()
    const automation = game.gameData.automation
    assert.equal(automation.autoPromote, false)
    assert.equal(automation.autoLearn, false)
    assert.equal(automation.skippedSkills.size, 0)
})

test("the checkboxes update the automation state", () => {
    const game = loadGame()
    const document = game.window.document
    document.getElementById("autoPromote").checked = true
    document.getElementById("autoLearn").checked = true
    document.getElementById("row Strength").getElementsByClassName("checkbox")[0].checked = true
    const automation = game.gameData.automation
    assert.equal(automation.autoPromote, true)
    assert.equal(automation.autoLearn, true)
    assert.deepEqual([...automation.skippedSkills], ["strength"])

    document.getElementById("autoPromote").checked = false
    document.getElementById("row Strength").getElementsByClassName("checkbox")[0].checked = false
    assert.equal(automation.autoPromote, false)
    assert.equal(automation.skippedSkills.size, 0)
})

test("auto-promote follows the state, not the checkbox", () => {
    const game = loadGame()
    game.task("Beggar").level = 10
    game.ticks(1)
    assert.equal(game.gameData.currentJob.name, "Beggar", "off by default")

    game.run("setAutoPromote(true)")
    game.ticks(1)
    assert.equal(game.gameData.currentJob.name, "Farmer")
    assert.equal(game.window.document.getElementById("autoPromote").checked, false)
})

test("auto-learn follows the state, including skipped skills", () => {
    const game = loadGame()
    game.task("Concentration").level = 5
    game.run("setSkillWithLowestMaxXp()")
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Concentration", "off by default")

    game.run("setAutoLearn(true)")
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Productivity")

    game.run("setSkillSkipped('Productivity', true)")
    game.run("setSkillWithLowestMaxXp()")
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Strength")
})

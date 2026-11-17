// Automation settings live in game state. The checkboxes only change that
// state; the game logic never reads the checkboxes.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadGame } from "./helpers/game.js"

test("automation starts switched off", async () => {
    const game = await loadGame()
    const automation = game.gameData.automation
    assert.equal(automation.autoPromote, false)
    assert.equal(automation.autoLearn, false)
    assert.equal(automation.skippedSkills.size, 0)
})

test("the checkboxes update the automation state", async () => {
    const game = await loadGame()
    const document = game.window.document
    game.setChecked(document.getElementById("autoPromote"), true)
    game.setChecked(document.getElementById("autoLearn"), true)
    game.setChecked(document.getElementById("row Strength").getElementsByClassName("checkbox")[0], true)
    const automation = game.gameData.automation
    assert.equal(automation.autoPromote, true)
    assert.equal(automation.autoLearn, true)
    assert.deepEqual([...automation.skippedSkills], ["strength"])

    game.setChecked(document.getElementById("autoPromote"), false)
    game.setChecked(document.getElementById("row Strength").getElementsByClassName("checkbox")[0], false)
    assert.equal(automation.autoPromote, false)
    assert.equal(automation.skippedSkills.size, 0)
})

test("auto-promote follows the state, not the checkbox", async () => {
    const game = await loadGame()
    game.task("Beggar").level = 10
    game.ticks(1)
    assert.equal(game.gameData.currentJob.name, "Beggar", "off by default")

    // Changing only the state (the checkbox is never touched) is enough
    game.api.setAutoPromote(true)
    game.ticks(1)
    assert.equal(game.gameData.currentJob.name, "Farmer")
})

test("auto-learn follows the state, including skipped skills", async () => {
    const game = await loadGame()
    game.task("Concentration").level = 5
    game.api.setSkillWithLowestMaxXp()
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Concentration", "off by default")

    game.api.setAutoLearn(true)
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Productivity")

    game.api.setSkillSkipped('Productivity', true)
    game.api.setSkillWithLowestMaxXp()
    game.ticks(1)
    assert.equal(game.gameData.currentSkill.name, "Strength")
})

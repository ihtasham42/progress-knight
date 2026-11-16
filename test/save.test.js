"use strict"

// Saving, loading, importing, exporting and upgrading old saves.
//
// fixtures/legacy-save.json is a real save written by the original game
// (ihtasham42/progress-knight) after an evil rebirth, a normal rebirth and
// buying a Tent and a Book. It was saved while paused, so the tick the game
// runs on load doesn't change anything.

const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { loadGame } = require("./helpers/game")

const legacyRaw = fs.readFileSync(path.join(__dirname, "fixtures", "legacy-save.json"), "utf8")
const legacy = JSON.parse(legacyRaw)

function savedState(game) {
    return JSON.parse(game.run("JSON.stringify(serializeGameData())"))
}

function importText(game, text) {
    game.window.document.getElementById("importExportBox").value = text
    game.run("importGameData()")
    const error = game.window.document.getElementById("importError")
    return error.classList.contains("hidden") ? null : error.textContent
}

test("an old save from the original game loads with everything intact", () => {
    const game = loadGame({ localStorage: { gameDataSave: legacyRaw } })
    const data = game.gameData

    assert.equal(data.coins, legacy.coins)
    assert.equal(data.days, legacy.days)
    assert.equal(data.evil, 1)
    assert.equal(data.rebirthOneCount, 1)
    assert.equal(data.rebirthTwoCount, 1)
    assert.equal(data.paused, true)
    assert.equal(data.currentJob.name, "Fisherman")
    assert.equal(data.currentSkill.name, "Concentration")
    assert.equal(data.currentProperty.name, "Tent")
    assert.deepEqual(Array.from(data.currentMisc, item => item.name), ["Book"])

    for (const [name, oldTask] of Object.entries(legacy.taskData)) {
        const task = game.task(name)
        assert.equal(task.level, oldTask.level, name + " level")
        assert.equal(task.maxLevel, oldTask.maxLevel, name + " max level")
        assert.equal(task.xp, oldTask.xp, name + " xp")
    }

    for (const [key, oldRequirement] of Object.entries(legacy.requirements)) {
        assert.equal(game.run(`gameData.requirements[${JSON.stringify(key)}].completed`), oldRequirement.completed, key)
    }
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("loading an old save keeps an untouched backup and re-saves in the new format", () => {
    const game = loadGame({ localStorage: { gameDataSave: legacyRaw } })
    assert.equal(game.window.localStorage.getItem("gameDataSave_legacyBackup"), legacyRaw)

    game.run("saveGameData()")
    const saved = JSON.parse(game.window.localStorage.getItem("gameDataSave"))
    assert.equal(saved.version, 2)
    assert.ok(JSON.stringify(saved).length < legacyRaw.length / 5, "new saves are much smaller")

    const reloaded = loadGame({ localStorage: { ...game.window.localStorage } })
    assert.equal(reloaded.window.localStorage.getItem("gameDataSave_legacyBackup"), legacyRaw, "backup isn't replaced")
})

test("a new-format save loads back to exactly the same state", () => {
    const game = loadGame({ localStorage: { gameDataSave: legacyRaw } })
    game.run("gameData.paused = false")
    game.ticks(500)
    game.run("gameData.paused = true; saveGameData()")
    const before = savedState(game)

    const reloaded = loadGame({ localStorage: { gameDataSave: game.window.localStorage.getItem("gameDataSave") } })
    assert.deepEqual(savedState(reloaded), before)
})

test("an export string from the original game can be imported", () => {
    const game = loadGame()
    const exportString = Buffer.from(legacyRaw).toString("base64")
    assert.equal(importText(game, exportString), null)

    const reloaded = loadGame({ localStorage: { gameDataSave: game.window.localStorage.getItem("gameDataSave") } })
    assert.equal(reloaded.gameData.currentJob.name, "Fisherman")
    assert.equal(reloaded.gameData.evil, 1)
    assert.equal(reloaded.task("Farmer").maxLevel, 10)
})

test("export then import round-trips", () => {
    const game = loadGame({ localStorage: { gameDataSave: legacyRaw } })
    game.run("exportGameData()")
    const exportString = game.window.document.getElementById("importExportBox").value
    assert.equal(JSON.parse(Buffer.from(exportString, "base64").toString()).version, 2)

    const other = loadGame()
    assert.equal(importText(other, exportString), null)
    const reloaded = loadGame({ localStorage: { gameDataSave: other.window.localStorage.getItem("gameDataSave") } })
    assert.deepEqual(savedState(reloaded), savedState(game))
})

test("bad imports show a message and leave the current save alone", () => {
    const game = loadGame()
    game.run("saveGameData()")
    const current = game.window.localStorage.getItem("gameDataSave")
    const encode = value => Buffer.from(JSON.stringify(value)).toString("base64")

    assert.match(importText(game, "not a save!!"), /doesn't look like a Progress Knight save/)
    assert.match(importText(game, Buffer.from("hello").toString("base64")), /doesn't look like a Progress Knight save/)
    assert.match(importText(game, encode({ coins: 5 })), /couldn't be loaded: Legacy save has no task data/)
    assert.match(importText(game, encode({ version: 3, coins: 1, days: 1, tasks: {} })), /newer version of the game/)
    assert.equal(game.window.localStorage.getItem("gameDataSave"), current)

    game.run("exportGameData()")
    assert.equal(importText(game, game.window.document.getElementById("importExportBox").value), null, "export clears the message")
})

test("migrateSave rejects things that aren't saves", () => {
    const game = loadGame()
    const reasons = game.run(`[null, 5, [], {}, {version: 1}, {version: 2, coins: "lots", days: 1, tasks: {}}, {version: 2, coins: 1, days: 1}]
        .map(save => { try { migrateSave(save); return "accepted" } catch (error) { return error.message } })`)
    assert.deepEqual(Array.from(reasons), [
        "Save is not an object",
        "Save is not an object",
        "Save is not an object",
        "Legacy save has no task data",
        "Unknown save version 1",
        "Save has an invalid coins",
        "Save has no task data",
    ])
})

test("unknown names and bad values in a save are ignored", () => {
    const save = {
        version: 2, coins: 500, days: 6000, evil: "lots", paused: true,
        currentJob: "Astronaut", currentSkill: "Farmer", currentProperty: "Book",
        currentMisc: ["Book", "Book", "Jetpack", "Tent"],
        tasks: { Farmer: { level: 7, maxLevel: "x", xp: 3 }, Astronaut: { level: 99 } },
        completedRequirements: ["Farmer", "Moon base"],
    }
    const game = loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
    const data = game.gameData

    assert.equal(data.coins, 500)
    assert.equal(data.evil, 0, "non-numeric evil keeps the default")
    assert.equal(data.currentJob.name, "Beggar", "unknown job")
    assert.equal(data.currentSkill.name, "Concentration", "a job isn't a skill")
    assert.equal(data.currentProperty.name, "Homeless", "a misc item isn't a property")
    assert.deepEqual(Array.from(data.currentMisc, item => item.name), ["Book"])
    assert.equal(game.task("Farmer").level, 7)
    assert.equal(game.task("Farmer").maxLevel, 0)
    assert.equal(game.run("gameData.requirements['Farmer'].completed"), true)
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("an unreadable save is kept aside and the game starts fresh", () => {
    const game = loadGame({ localStorage: { gameDataSave: "{not json" } })
    assert.equal(game.window.localStorage.getItem("gameDataSave_unreadable"), "{not json")
    assert.equal(game.gameData.currentJob.name, "Beggar")
    assert.match(game.errors.join("\n"), /Could not load save/)
})

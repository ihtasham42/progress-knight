// Saving, loading, importing, exporting and upgrading old saves.
//
// fixtures/legacy-save.json is a real save written by the original game
// (ihtasham42/progress-knight) after an evil rebirth, a normal rebirth and
// buying a Tent and a Book. It was saved while paused, so the tick the game
// runs on load doesn't change anything.
//
// fixtures/v2-save.json is the same game state saved in version 2 of this
// fork's format, which referred to everything by display name.
// fixtures/v3-save.json is the same state again in version 3 (by id, before
// automation settings were saved).
// fixtures/v4-save.json is the same state in version 4 (before the history of
// past lives).
// fixtures/v5-save.json is the same state in version 5 (before the world
// date), and fixtures/v5-save-lives.json the same with two past lives.
// fixtures/v6-save.json is that state with two past lives in version 6, when
// the date ran on from life to life.

import { test } from "vitest"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { loadGame } from "./helpers/game.js"

const legacyRaw = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "legacy-save.json"), "utf8")
const legacy = JSON.parse(legacyRaw)
const v2Raw = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "v2-save.json"), "utf8")
const v3Raw = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "v3-save.json"), "utf8")
const v4Raw = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "v4-save.json"), "utf8")
const v5Raw = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "v5-save.json"), "utf8")
const v5LivesRaw = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "v5-save-lives.json"), "utf8")
const v6Raw = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "v6-save.json"), "utf8")

function savedState(game) {
    return JSON.parse(JSON.stringify(game.api.serializeGameData()))
}

function importText(game, text) {
    game.type(game.byId("importExportBox"), text)
    game.click(game.byId("importButton"))
    const error = game.window.document.getElementById("importError")
    return error.classList.contains("hidden") ? null : error.textContent
}

test("an old save from the original game loads with everything intact", async () => {
    const game = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
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
        assert.equal(game.api.gameData.requirements[key].completed, oldRequirement.completed, key)
    }
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("loading an old save keeps an untouched backup and re-saves in the new format", async () => {
    const game = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    assert.equal(game.window.localStorage.getItem("gameDataSave_legacyBackup"), legacyRaw)

    game.api.saveGameData()
    const saved = JSON.parse(game.window.localStorage.getItem("gameDataSave"))
    assert.equal(saved.version, game.api.SAVE_VERSION)
    assert.ok(JSON.stringify(saved).length < legacyRaw.length / 5, "new saves are much smaller")

    const reloaded = await loadGame({ localStorage: { ...game.window.localStorage } })
    assert.equal(reloaded.window.localStorage.getItem("gameDataSave_legacyBackup"), legacyRaw, "backup isn't replaced")
})

test("a new-format save loads back to exactly the same state", async () => {
    const game = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    game.api.gameData.paused = false
    game.ticks(500)
    game.api.gameData.paused = true
    game.api.saveGameData()
    const before = savedState(game)

    const reloaded = await loadGame({ localStorage: { gameDataSave: game.window.localStorage.getItem("gameDataSave") } })
    assert.deepEqual(savedState(reloaded), before)
})

test("an export string from the original game can be imported", async () => {
    const game = await loadGame()
    const exportString = Buffer.from(legacyRaw).toString("base64")
    assert.equal(importText(game, exportString), null)

    const reloaded = await loadGame({ localStorage: { gameDataSave: game.window.localStorage.getItem("gameDataSave") } })
    assert.equal(reloaded.gameData.currentJob.name, "Fisherman")
    assert.equal(reloaded.gameData.evil, 1)
    assert.equal(reloaded.task("Farmer").maxLevel, 10)
})

test("export then import round-trips", async () => {
    const game = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    game.click(game.byId("exportButton"))
    const exportString = game.window.document.getElementById("importExportBox").value
    assert.equal(JSON.parse(Buffer.from(exportString, "base64").toString()).version, game.api.SAVE_VERSION)

    const other = await loadGame()
    assert.equal(importText(other, exportString), null)
    const reloaded = await loadGame({ localStorage: { gameDataSave: other.window.localStorage.getItem("gameDataSave") } })
    assert.deepEqual(savedState(reloaded), savedState(game))
})

test("bad imports show a message and leave the current save alone", async () => {
    const game = await loadGame()
    game.api.saveGameData()
    const current = game.window.localStorage.getItem("gameDataSave")
    const encode = value => Buffer.from(JSON.stringify(value)).toString("base64")

    assert.match(importText(game, "not a save!!"), /doesn't look like a Progress Knight save/)
    assert.match(importText(game, Buffer.from("hello").toString("base64")), /doesn't look like a Progress Knight save/)
    assert.match(importText(game, encode({ coins: 5 })), /couldn't be loaded: Legacy save has no task data/)
    assert.match(importText(game, encode({ version: 99, coins: 1, days: 1, tasks: {} })), /newer version of the game/)
    assert.equal(game.window.localStorage.getItem("gameDataSave"), current)

    game.click(game.byId("exportButton"))
    assert.equal(importText(game, game.window.document.getElementById("importExportBox").value), null, "export clears the message")
})

test("migrateSave rejects things that aren't saves", async () => {
    const game = await loadGame()
    const reasons = [null, 5, [], {}, {version: 1}, {version: 2, coins: "lots", days: 1, tasks: {}}, {version: 2, coins: 1, days: 1}]
        .map(save => { try { game.api.migrateSave(save); return "accepted" } catch (error) { return error.message } })
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

test("unknown names and bad values in a save are ignored", async () => {
    const save = {
        version: 2, coins: 500, days: 6000, evil: "lots", paused: true,
        currentJob: "Astronaut", currentSkill: "Farmer", currentProperty: "Book",
        currentMisc: ["Book", "Book", "Jetpack", "Tent"],
        tasks: { Farmer: { level: 7, maxLevel: "x", xp: 3 }, Astronaut: { level: 99 } },
        completedRequirements: ["Farmer", "Moon base"],
    }
    const game = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
    const data = game.gameData

    assert.equal(data.coins, 500)
    assert.equal(data.evil, 0, "non-numeric evil keeps the default")
    assert.equal(data.currentJob.name, "Beggar", "unknown job")
    assert.equal(data.currentSkill.name, "Concentration", "a job isn't a skill")
    assert.equal(data.currentProperty.name, "Homeless", "a misc item isn't a property")
    assert.deepEqual(Array.from(data.currentMisc, item => item.name), ["Book"])
    assert.equal(game.task("Farmer").level, 7)
    assert.equal(game.task("Farmer").maxLevel, 0)
    assert.equal(game.api.gameData.requirements['Farmer'].completed, true)
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("an unreadable save is kept aside and the game starts fresh", async () => {
    const game = await loadGame({ localStorage: { gameDataSave: "{not json" } })
    assert.equal(game.window.localStorage.getItem("gameDataSave_unreadable"), "{not json")
    assert.equal(game.gameData.currentJob.name, "Beggar")
    assert.match(game.errors.join("\n"), /Could not load save/)
})

test("a version 2 save (by name) loads to the same state as the original save", async () => {
    const fromLegacy = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    const fromV2 = await loadGame({ localStorage: { gameDataSave: v2Raw } })
    assert.deepEqual(savedState(fromV2), savedState(fromLegacy))
    assert.equal(fromV2.window.localStorage.getItem("gameDataSave_legacyBackup"), null, "only legacy saves are backed up")
})

test("saves refer to jobs, skills, items and unlocks by id", async () => {
    const game = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    const saved = savedState(game)
    assert.equal(saved.version, game.api.SAVE_VERSION)
    assert.equal(saved.currentJob, "fisherman")
    assert.equal(saved.currentSkill, "concentration")
    assert.equal(saved.currentProperty, "tent")
    assert.deepEqual(saved.currentMisc, ["book"])
    assert.deepEqual(saved.tasks.dark_influence, legacy.taskData["Dark influence"] && {
        level: legacy.taskData["Dark influence"].level,
        maxLevel: legacy.taskData["Dark influence"].maxLevel,
        xp: legacy.taskData["Dark influence"].xp,
    })
    assert.ok(saved.completedRequirements.includes("dark_magic"))
    assert.ok(saved.completedRequirements.includes("shop"))
})

test("ids that look like object properties don't break loading", async () => {
    const save = { version: 3, coins: 1, days: 6000, currentJob: "constructor", currentSkill: "__proto__",
        currentProperty: "toString", currentMisc: ["hasOwnProperty"], tasks: { constructor: { level: 5 } },
        completedRequirements: ["valueOf"] }
    const game = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
    assert.equal(game.gameData.currentJob.name, "Beggar")
    assert.equal(game.gameData.currentSkill.name, "Concentration")
    assert.equal(game.gameData.currentProperty.name, "Homeless")
    assert.equal(game.gameData.currentMisc.length, 0)
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("a version 3 save loads to the same state, with automation switched off", async () => {
    const fromLegacy = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    const fromV3 = await loadGame({ localStorage: { gameDataSave: v3Raw } })
    assert.deepEqual(savedState(fromV3), savedState(fromLegacy))
    assert.deepEqual(savedState(fromV3).automation, { autoPromote: false, autoLearn: false, skippedSkills: [] })
})

test("automation settings are saved and loaded", async () => {
    const game = await loadGame()
    game.api.setAutoPromote(true)
    game.api.setAutoLearn(true)
    game.api.setSkillSkipped('Bargaining', true)
    game.api.setSkillSkipped('Strength', true)
    game.api.saveGameData()
    const reloaded = await loadGame({ localStorage: { gameDataSave: game.window.localStorage.getItem("gameDataSave") } })
    const automation = reloaded.gameData.automation
    assert.equal(automation.autoPromote, true)
    assert.equal(automation.autoLearn, true)
    assert.deepEqual(Array.from(automation.skippedSkills).sort(), ["bargaining", "strength"])
})

test("bad automation settings in a save are ignored", async () => {
    const save = JSON.parse(v3Raw)
    save.version = 4
    save.automation = { autoPromote: "yes", autoLearn: true, skippedSkills: ["farmer", "nonsense", "constructor", "meditation"] }
    const game = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
    assert.equal(game.gameData.automation.autoPromote, false)
    assert.equal(game.gameData.automation.autoLearn, true)
    assert.deepEqual(Array.from(game.gameData.automation.skippedSkills), ["meditation"], "only real skills can be skipped")
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("importSave and exportSave work with text only, not the page", async () => {
    const game = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    const exportString = game.api.exportSave()
    assert.equal(JSON.parse(Buffer.from(exportString, "base64").toString()).version, game.api.SAVE_VERSION)

    const other = await loadGame()
    other.api.saveGameData()
    const current = other.window.localStorage.getItem("gameDataSave")
    assert.match(other.api.importSave('not a save!!'), /doesn't look like a Progress Knight save/)
    assert.equal(other.window.localStorage.getItem("gameDataSave"), current)
    assert.equal(other.api.importSave(exportString), undefined)
    assert.equal(JSON.parse(other.window.localStorage.getItem("gameDataSave")).currentJob, "fisherman")
})

test("older saves start with no past lives and the coins held as the peak", async () => {
    const fromLegacy = await loadGame({ localStorage: { gameDataSave: legacyRaw } })
    for (const raw of [legacyRaw, v2Raw, v3Raw, v4Raw, v5Raw]) {
        const game = await loadGame({ localStorage: { gameDataSave: raw } })
        assert.deepEqual(Array.from(game.gameData.lives), [])
        assert.equal(game.gameData.lifePeakCoins, game.gameData.coins)
        assert.deepEqual(savedState(game), savedState(fromLegacy))
    }
    const saved = savedState(fromLegacy)
    assert.equal(saved.version, 7)
    assert.deepEqual(saved.lives, [])
})

const life = overrides => ({
    life: 1, end: "rebirth", age: 66, job: { id: "footman", level: 31 }, skill: { id: "strength", level: 112 },
    peakCoins: 81200, evil: 0, ...overrides,
})

test("past lives and the peak purse are saved and loaded", async () => {
    const game = await loadGame()
    game.api.getTaskById("footman").level = 31
    game.api.gameData.coins = 81200
    game.api.rebirthOne()
    game.api.gameData.coins = 40
    game.api.gameData.lifePeakCoins = 900
    game.api.saveGameData()
    const before = savedState(game)
    assert.equal(before.lives.length, 1)
    assert.equal(before.lives[0].job.id, "footman")
    assert.equal(before.lifePeakCoins, 900)

    const reloaded = await loadGame({ localStorage: { gameDataSave: game.window.localStorage.getItem("gameDataSave") } })
    const after = savedState(reloaded)
    assert.deepEqual(after.lives, before.lives)
    assert.equal(after.lifePeakCoins, 900)
    assert.equal(reloaded.gameData.lives[0].peakCoins, 81200)
})

test("malformed past lives are dropped, unknown tasks are kept", async () => {
    const save = JSON.parse(v4Raw)
    save.version = 5
    save.lifePeakCoins = 5
    save.lives = [
        life({ life: 1 }),
        life({ life: 2, job: { id: "astronaut", level: 3 } }),
        life({ life: 3, end: "died" }),
        life({ life: 4, age: "old" }),
        life({ life: 5, peakCoins: -1 }),
        life({ life: 6, skill: null }),
        life({ life: 7, job: { id: 5, level: 1 } }),
        life({ life: 0 }),
        life({ life: 9, end: "evil", evil: 3 }),
        null, 7, "x", [],
    ]
    const game = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
    assert.deepEqual(Array.from(game.gameData.lives, entry => entry.life), [1, 2, 9])
    assert.equal(game.gameData.lives[1].job.id, "astronaut")
    assert.equal(game.gameData.lives[2].evil, 3)
    assert.equal(game.gameData.lifePeakCoins, game.gameData.coins, "a peak below the coins held is raised to them")
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("a save with bad past lives or none keeps the game going", async () => {
    for (const lives of [undefined, "many", {}, 5]) {
        const save = JSON.parse(v4Raw)
        save.version = 5
        save.lives = lives
        save.lifePeakCoins = "lots"
        const game = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
        assert.deepEqual(Array.from(game.gameData.lives), [])
        assert.equal(game.gameData.lifePeakCoins, game.gameData.coins)
    }
})

test("only the last 50 saved lives are loaded", async () => {
    const save = JSON.parse(v4Raw)
    save.version = 5
    save.lives = Array.from({ length: 60 }, (_, i) => life({ life: i + 1 }))
    const game = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
    assert.equal(game.gameData.lives.length, 50)
    assert.equal(game.gameData.lives[0].life, 11)
})

test("version 5 and 6 saves with past lives keep the lives, and this life wakes in 1200", async () => {
    for (const raw of [v5LivesRaw, v6Raw]) {
        const game = await loadGame({ localStorage: { gameDataSave: raw } })
        const [first, second] = game.gameData.lives
        assert.deepEqual([first.age, second.age], [70, 52])
        assert.equal(first.job.id, "fisherman", "the rest of each life is kept")
        assert.equal(game.api.formatDate(game.api.toDate(game.api.getWorldDay())), "Winter 52, 1201", "this life is 15")
        assert.equal(game.errors.length, 0, game.errors.join("\n"))

        // Life 1 reached 70, in 1256: further than life 2 (52) or this one (15)
        assert.equal(game.gameData.furthestDay, 56 * 365)

        const saved = savedState(game)
        assert.equal(saved.version, 7)
        assert.equal(saved.furthestDay, 56 * 365)
        assert.equal(saved.lifeStartDay, undefined)
        assert.deepEqual(saved.lives.map(entry => [entry.born, entry.ended]), [[undefined, undefined], [undefined, undefined]])
    }
})

test("the old dates on a version 6 save are dropped whatever they hold", async () => {
    const save = JSON.parse(v6Raw)
    save.lifeStartDay = "soon"
    save.lives = [
        { ...save.lives[0], life: 1, born: undefined, ended: "later" },
        { ...save.lives[0], life: 2, born: 10, ended: 5 },
        null,
    ]
    const game = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
    assert.deepEqual(Array.from(game.gameData.lives, entry => entry.life), [1, 2])
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
})

test("older saves with no past lives start the record from this life", async () => {
    for (const raw of [legacyRaw, v5Raw]) {
        const game = await loadGame({ localStorage: { gameDataSave: raw } })
        assert.equal(game.gameData.furthestDay, game.api.getWorldDay())
        assert.ok(game.gameData.furthestDay > 0)
    }
})

test("the record is saved and loaded, and a bad or lower one is ignored", async () => {
    const game = await loadGame()
    game.api.gameData.days = 70 * 365
    game.api.rebirthOne()
    game.api.saveGameData()
    const raw = game.window.localStorage.getItem("gameDataSave")
    assert.equal(JSON.parse(raw).furthestDay, 56 * 365)
    const reloaded = await loadGame({ localStorage: { gameDataSave: raw } })
    assert.equal(reloaded.gameData.furthestDay, 56 * 365)

    for (const furthestDay of ["far", -5, null, undefined, 1]) {
        const save = { ...JSON.parse(raw), days: 30 * 365, furthestDay }
        const bad = await loadGame({ localStorage: { gameDataSave: JSON.stringify(save) } })
        assert.equal(Math.floor(bad.gameData.furthestDay), 16 * 365, "the record is at least where this life is: " + furthestDay)
    }
})

test("a new game, and so a hard reset, starts on Summer 1, 1200", async () => {
    const game = await loadGame()
    assert.ok(game.gameData.furthestDay < 1, "with no record")
    assert.equal(game.api.formatDate(game.api.toDate(game.api.getWorldDay())), "Summer 1, 1200")
})

// Saving, loading, importing and exporting game data.

import { namesById, idsByName } from "./data.ts"
import { gameData } from "./state.ts"
import { Job, Skill } from "./classes.ts"
import { getTaskById, getItemById, setAutoPromote, setAutoLearn, setSkillSkipped } from "./engine.js"

export function saveGameData() {
    localStorage.setItem("gameDataSave", JSON.stringify(serializeGameData()))
}

export function loadGameData() {
    const rawSave = localStorage.getItem("gameDataSave")
    if (rawSave === null) return

    try {
        const parsedSave = JSON.parse(rawSave)
        backUpLegacySave(parsedSave, rawSave)
        applySaveData(migrateSave(parsedSave))
    } catch (error) {
        // Keep the unreadable save so progress isn't silently lost when the
        // autosave overwrites it with a fresh game.
        console.error("Could not load save:", error)
        localStorage.setItem("gameDataSave_unreadable", rawSave)
    }
}

// The first time a pre-version-2 save is loaded, keep an untouched copy so
// the player can go back to the original game if they want to.
export function backUpLegacySave(parsedSave, rawSave) {
    const isLegacy = parsedSave !== null && typeof parsedSave === "object" && parsedSave.version === undefined
    if (isLegacy && localStorage.getItem("gameDataSave_legacyBackup") === null) {
        localStorage.setItem("gameDataSave_legacyBackup", rawSave)
    }
}

// Deletes the save (and its backups). The page reloads afterwards.
export function clearSave() {
    localStorage.clear()
}

// Checks an export string and, if it's a save the game can load, stores it
// as the current save. Returns a message for the player if it can't be used
// (the current save is then left alone), or nothing once it's stored.
export function importSave(text) {
    let data
    try {
        data = JSON.parse(atob(text.trim()))
    } catch {
        return "That doesn't look like a Progress Knight save. Paste the full text from Export."
    }

    let save
    try {
        save = migrateSave(data)
    } catch (error) {
        return "That save couldn't be loaded: " + error.message + "."
    }

    localStorage.setItem("gameDataSave", JSON.stringify(save))
}

// The current game as text the player can copy and import later
export function exportSave() {
    return btoa(JSON.stringify(serializeGameData()))
}

// ---------------------------------------------------------------------------
// Versioned save format
//
// A save only holds the state that changes during play. Static game data
// (job/skill/item definitions and requirement definitions) is rebuilt by
// initGameData() in engine.js on every load, and the save is then applied on
// top.
//
// Version history:
//   (none) - legacy format: the whole gameData object passed to JSON.stringify
//   2      - only mutable state, referring to jobs/skills/items by name
//   3      - the same, referring to everything by id (see data.ts)
//   4      - adds automation settings (auto-promote, auto-learn, skipped skills)
// ---------------------------------------------------------------------------

export const SAVE_VERSION = 4

export function serializeGameData() {
    const tasks = {}
    for (const name in gameData.taskData) {
        const task = gameData.taskData[name]
        tasks[task.baseData.id] = {level: task.level, maxLevel: task.maxLevel, xp: task.xp}
    }

    const completedRequirements = []
    for (const key in gameData.requirements) {
        if (gameData.requirements[key].completed) completedRequirements.push(idsByName[key])
    }

    return {
        version: SAVE_VERSION,
        coins: gameData.coins,
        days: gameData.days,
        evil: gameData.evil,
        paused: gameData.paused,
        timeWarpingEnabled: gameData.timeWarpingEnabled,
        rebirthOneCount: gameData.rebirthOneCount,
        rebirthTwoCount: gameData.rebirthTwoCount,
        currentJob: gameData.currentJob.baseData.id,
        currentSkill: gameData.currentSkill.baseData.id,
        currentProperty: gameData.currentProperty.baseData.id,
        currentMisc: gameData.currentMisc.map(function(item) {return item.baseData.id}),
        tasks: tasks,
        completedRequirements: completedRequirements,
        automation: {
            autoPromote: gameData.automation.autoPromote,
            autoLearn: gameData.automation.autoLearn,
            skippedSkills: Array.from(gameData.automation.skippedSkills),
        },
    }
}

// Converts any supported save into the current format. Throws if the save
// can't be understood.
export function migrateSave(save) {
    if (save === null || typeof save !== "object" || Array.isArray(save)) {
        throw new Error("Save is not an object")
    }

    if (save.version === undefined) save = migrateLegacySave(save)
    if (save.version === 2) save = migrateV2ToV3(save)
    if (save.version === 3) save = migrateV3ToV4(save)

    if (save.version > SAVE_VERSION) {
        throw new Error("Save is from a newer version of the game")
    }
    if (save.version !== SAVE_VERSION) {
        throw new Error("Unknown save version " + save.version)
    }

    validateSave(save)
    return save
}

export function migrateLegacySave(legacy) {
    if (typeof legacy.taskData !== "object" || legacy.taskData === null) {
        throw new Error("Legacy save has no task data")
    }

    const tasks = {}
    for (const name in legacy.taskData) {
        const task = legacy.taskData[name] || {}
        tasks[name] = {level: task.level, maxLevel: task.maxLevel, xp: task.xp}
    }

    const completedRequirements = []
    for (const key in legacy.requirements || {}) {
        const requirement = legacy.requirements[key]
        if (requirement && requirement.completed) completedRequirements.push(key)
    }

    const nameOf = function(entity) {return entity && entity.name}

    return {
        version: 2,
        coins: legacy.coins,
        days: legacy.days,
        evil: legacy.evil,
        paused: legacy.paused,
        timeWarpingEnabled: legacy.timeWarpingEnabled,
        rebirthOneCount: legacy.rebirthOneCount,
        rebirthTwoCount: legacy.rebirthTwoCount,
        currentJob: nameOf(legacy.currentJob),
        currentSkill: nameOf(legacy.currentSkill),
        currentProperty: nameOf(legacy.currentProperty),
        currentMisc: Array.isArray(legacy.currentMisc) ? legacy.currentMisc.map(nameOf) : [],
        tasks: tasks,
        completedRequirements: completedRequirements,
    }
}

// Version 2 referred to jobs, skills, items and unlocks by display name.
// Names the game no longer has are dropped.
export function migrateV2ToV3(save) {
    const toId = name => typeof name === "string" ? idsByName[name] : undefined
    const migrated = Object.assign({}, save, {version: 3})

    if (save.tasks && typeof save.tasks === "object") {
        migrated.tasks = {}
        for (const name in save.tasks) {
            if (toId(name)) migrated.tasks[toId(name)] = save.tasks[name]
        }
    }
    migrated.currentJob = toId(save.currentJob)
    migrated.currentSkill = toId(save.currentSkill)
    migrated.currentProperty = toId(save.currentProperty)
    for (const key of ["currentMisc", "completedRequirements"]) {
        if (Array.isArray(save[key])) migrated[key] = save[key].map(toId).filter(Boolean)
    }
    return migrated
}

// Version 3 didn't save automation settings, so they start switched off
export function migrateV3ToV4(save) {
    return Object.assign({}, save, {
        version: 4,
        automation: {autoPromote: false, autoLearn: false, skippedSkills: []},
    })
}

export function validateSave(save) {
    for (const key of ["coins", "days"]) {
        if (!isFiniteNumber(save[key])) throw new Error("Save has an invalid " + key)
    }
    if (typeof save.tasks !== "object" || save.tasks === null) {
        throw new Error("Save has no task data")
    }
}

export function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value)
}

// Applies a current-format save on top of freshly initialised gameData.
// Anything the save doesn't have, or that no longer exists in the game,
// keeps its default value.
export function applySaveData(save) {
    for (const key of ["coins", "days", "evil", "rebirthOneCount", "rebirthTwoCount"]) {
        if (isFiniteNumber(save[key])) gameData[key] = save[key]
    }
    for (const key of ["paused", "timeWarpingEnabled"]) {
        if (typeof save[key] === "boolean") gameData[key] = save[key]
    }

    for (const id in save.tasks) {
        const task = getTaskById(id)
        const savedTask = save.tasks[id]
        if (!task || !savedTask) continue
        for (const key of ["level", "maxLevel", "xp"]) {
            if (isFiniteNumber(savedTask[key])) task[key] = savedTask[key]
        }
    }

    const job = getTaskById(save.currentJob)
    if (job instanceof Job) gameData.currentJob = job

    const skill = getTaskById(save.currentSkill)
    if (skill instanceof Skill) gameData.currentSkill = skill

    const property = getItemById(save.currentProperty)
    if (property && property.baseData.category == "Properties") gameData.currentProperty = property

    if (Array.isArray(save.currentMisc)) {
        gameData.currentMisc = []
        for (const id of save.currentMisc) {
            const item = getItemById(id)
            if (item && item.baseData.category == "Misc" && !gameData.currentMisc.includes(item)) {
                gameData.currentMisc.push(item)
            }
        }
    }

    if (Array.isArray(save.completedRequirements)) {
        for (const id of save.completedRequirements) {
            const requirement = gameData.requirements[namesById[id]]
            if (requirement) requirement.completed = true
        }
    }

    const automation = save.automation
    if (automation && typeof automation === "object") {
        if (typeof automation.autoPromote === "boolean") setAutoPromote(automation.autoPromote)
        if (typeof automation.autoLearn === "boolean") setAutoLearn(automation.autoLearn)
        if (Array.isArray(automation.skippedSkills)) {
            for (const id of automation.skippedSkills) {
                if (getTaskById(id) instanceof Skill) setSkillSkipped(namesById[id], true)
            }
        }
    }
}

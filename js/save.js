"use strict"

// Saving, loading, importing and exporting game data.

function saveGameData() {
    localStorage.setItem("gameDataSave", JSON.stringify(serializeGameData()))
}

function loadGameData() {
    const rawSave = localStorage.getItem("gameDataSave")
    if (rawSave === null) return

    try {
        applySaveData(migrateSave(JSON.parse(rawSave)))
    } catch (error) {
        // Keep the unreadable save so progress isn't silently lost when the
        // autosave overwrites it with a fresh game.
        console.error("Could not load save:", error)
        localStorage.setItem("gameDataSave_unreadable", rawSave)
    }
}

function resetGameData() {
    localStorage.clear()
    location.reload()
}

function importGameData() {
    const importExportBox = document.getElementById("importExportBox")
    let data
    try {
        data = JSON.parse(window.atob(importExportBox.value.trim()))
    } catch (error) {
        showImportError("That doesn't look like a Progress Knight save. Paste the full text from Export.")
        return
    }

    let save
    try {
        save = migrateSave(data)
    } catch (error) {
        showImportError("That save couldn't be loaded: " + error.message + ".")
        return
    }

    localStorage.setItem("gameDataSave", JSON.stringify(save))
    location.reload()
}

function showImportError(message) {
    const importError = document.getElementById("importError")
    importError.textContent = message
    importError.classList.remove("hidden")
}

function hideImportError() {
    document.getElementById("importError").classList.add("hidden")
}

function exportGameData() {
    hideImportError()
    const importExportBox = document.getElementById("importExportBox")
    importExportBox.value = window.btoa(JSON.stringify(serializeGameData()))
}

// ---------------------------------------------------------------------------
// Versioned save format
//
// A save only holds the state that changes during play. Static game data
// (job/skill/item definitions, requirement definitions, DOM references) is
// rebuilt by main.js on every load, and the save is then applied on top.
//
// Version history:
//   (none) - legacy format: the whole gameData object passed to JSON.stringify
//   2      - this format
// ---------------------------------------------------------------------------

const SAVE_VERSION = 2

function serializeGameData() {
    const tasks = {}
    for (const name in gameData.taskData) {
        const task = gameData.taskData[name]
        tasks[name] = {level: task.level, maxLevel: task.maxLevel, xp: task.xp}
    }

    const completedRequirements = []
    for (const key in gameData.requirements) {
        if (gameData.requirements[key].completed) completedRequirements.push(key)
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
        currentJob: gameData.currentJob.name,
        currentSkill: gameData.currentSkill.name,
        currentProperty: gameData.currentProperty.name,
        currentMisc: gameData.currentMisc.map(function(item) {return item.name}),
        tasks: tasks,
        completedRequirements: completedRequirements,
    }
}

// Converts any supported save into the current format. Throws if the save
// can't be understood.
function migrateSave(save) {
    if (save === null || typeof save !== "object" || Array.isArray(save)) {
        throw new Error("Save is not an object")
    }

    if (save.version === undefined) save = migrateLegacySave(save)

    if (save.version > SAVE_VERSION) {
        throw new Error("Save is from a newer version of the game")
    }
    if (save.version !== SAVE_VERSION) {
        throw new Error("Unknown save version " + save.version)
    }

    validateSave(save)
    return save
}

function migrateLegacySave(legacy) {
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

function validateSave(save) {
    for (const key of ["coins", "days"]) {
        if (!isFiniteNumber(save[key])) throw new Error("Save has an invalid " + key)
    }
    if (typeof save.tasks !== "object" || save.tasks === null) {
        throw new Error("Save has no task data")
    }
}

function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value)
}

// Applies a current-format save on top of freshly initialised gameData.
// Anything the save doesn't have, or that no longer exists in the game,
// keeps its default value.
function applySaveData(save) {
    for (const key of ["coins", "days", "evil", "rebirthOneCount", "rebirthTwoCount"]) {
        if (isFiniteNumber(save[key])) gameData[key] = save[key]
    }
    for (const key of ["paused", "timeWarpingEnabled"]) {
        if (typeof save[key] === "boolean") gameData[key] = save[key]
    }

    for (const name in save.tasks) {
        const task = gameData.taskData[name]
        const savedTask = save.tasks[name]
        if (!task || !savedTask) continue
        for (const key of ["level", "maxLevel", "xp"]) {
            if (isFiniteNumber(savedTask[key])) task[key] = savedTask[key]
        }
    }

    const job = gameData.taskData[save.currentJob]
    if (job instanceof Job) gameData.currentJob = job

    const skill = gameData.taskData[save.currentSkill]
    if (skill instanceof Skill) gameData.currentSkill = skill

    if (itemCategories["Properties"].includes(save.currentProperty)) {
        gameData.currentProperty = gameData.itemData[save.currentProperty]
    }

    if (Array.isArray(save.currentMisc)) {
        gameData.currentMisc = []
        for (const name of save.currentMisc) {
            if (itemCategories["Misc"].includes(name) && !gameData.currentMisc.includes(gameData.itemData[name])) {
                gameData.currentMisc.push(gameData.itemData[name])
            }
        }
    }

    if (Array.isArray(save.completedRequirements)) {
        for (const key of save.completedRequirements) {
            if (gameData.requirements[key]) gameData.requirements[key].completed = true
        }
    }
}

"use strict"

// Saving, loading, importing and exporting game data.

function assignMethods() {

    for (const key in gameData.taskData) {
        let task = gameData.taskData[key]
        if (task.baseData.income) {
            task.baseData = jobBaseData[task.name]
            task = Object.assign(new Job(jobBaseData[task.name]), task)
            
        } else {
            task.baseData = skillBaseData[task.name]
            task = Object.assign(new Skill(skillBaseData[task.name]), task)
        } 
        gameData.taskData[key] = task
    }

    for (const key in gameData.itemData) {
        let item = gameData.itemData[key]
        item.baseData = itemBaseData[item.name]
        item = Object.assign(new Item(itemBaseData[item.name]), item)
        gameData.itemData[key] = item
    }

    for (const key in gameData.requirements) {
        let requirement = gameData.requirements[key]
        if (requirement.type == "task") {
            requirement = Object.assign(new TaskRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "coins") {
            requirement = Object.assign(new CoinRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "age") {
            requirement = Object.assign(new AgeRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "evil") {
            requirement = Object.assign(new EvilRequirement(requirement.elements, requirement.requirements), requirement)
        }

        const tempRequirement = tempData["requirements"][key]
        requirement.elements = tempRequirement.elements
        requirement.requirements = tempRequirement.requirements
        gameData.requirements[key] = requirement
    }

    gameData.currentJob = gameData.taskData[gameData.currentJob.name]
    gameData.currentSkill = gameData.taskData[gameData.currentSkill.name]
    gameData.currentProperty = gameData.itemData[gameData.currentProperty.name]
    const newArray = []
    for (const misc of gameData.currentMisc) {
        newArray.push(gameData.itemData[misc.name])
    }
    gameData.currentMisc = newArray
}

function replaceSaveDict(dict, saveDict) {
    for (const key in dict) {
        if (!(key in saveDict)) {
            saveDict[key] = dict[key]
        } else if (dict == gameData.requirements) {
            if (saveDict[key].type != tempData["requirements"][key].type) {
                saveDict[key] = tempData["requirements"][key]
            }
        }
    }

    for (const key in saveDict) {
        if (!(key in dict)) {
            delete saveDict[key]
        }
    }
}

function saveGameData() {
    localStorage.setItem("gameDataSave", JSON.stringify(gameData))
}

function loadGameData() {
    const gameDataSave = JSON.parse(localStorage.getItem("gameDataSave"))

    if (gameDataSave !== null) {
        replaceSaveDict(gameData, gameDataSave)
        replaceSaveDict(gameData.requirements, gameDataSave.requirements)
        replaceSaveDict(gameData.taskData, gameDataSave.taskData)
        replaceSaveDict(gameData.itemData, gameDataSave.itemData)

        gameData = gameDataSave
    }

    assignMethods()
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

    if (!isValidSave(data)) {
        showImportError("That save is missing data the game needs, so it wasn't loaded.")
        return
    }

    gameData = data
    saveGameData()
    location.reload()
}

function isValidSave(data) {
    if (data === null || typeof data !== "object") return false
    if (typeof data.taskData !== "object" || typeof data.itemData !== "object") return false
    if (typeof data.coins !== "number" || typeof data.days !== "number") return false
    for (const key of ["currentJob", "currentSkill", "currentProperty"]) {
        if (!data[key] || typeof data[key].name !== "string") return false
    }
    return Array.isArray(data.currentMisc)
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
    importExportBox.value = window.btoa(JSON.stringify(gameData))
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

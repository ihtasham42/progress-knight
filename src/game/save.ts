// Saving, loading, importing and exporting game data.

import { namesById, idsByName } from "./data.ts"
import { gameData, MAX_LIVES } from "./state.ts"
import type { Life, LifeEnd } from "./state.ts"
import { Job, Skill } from "./classes.ts"
import { getTaskById, getItemById, setAutoPromote, setAutoLearn, setSkillSkipped } from "./engine.ts"

// When the game was last saved successfully, for the Settings tab. It isn't
// part of the save.
let lastSavedAt: number | null = null

// Whole seconds since then, or null before the first save
export function secondsSinceSave(): number | null {
    return lastSavedAt === null ? null : Math.max(0, Math.floor((Date.now() - lastSavedAt) / 1000))
}

export function saveGameData() {
    localStorage.setItem("gameDataSave", JSON.stringify(serializeGameData()))
    lastSavedAt = Date.now()
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
function backUpLegacySave(parsedSave: unknown, rawSave: string): void {
    const isLegacy = parsedSave !== null && typeof parsedSave === "object" && (parsedSave as {version?: unknown}).version === undefined
    if (isLegacy && localStorage.getItem("gameDataSave_legacyBackup") === null) {
        localStorage.setItem("gameDataSave_legacyBackup", rawSave)
    }
}

// Deletes the save (and its backups). The page reloads afterwards. The
// player's display preferences are kept: this resets the game, not the settings.
export function clearSave() {
    for (const key of ["gameDataSave", "gameDataSave_unreadable", "gameDataSave_legacyBackup"]) {
        localStorage.removeItem(key)
    }
}

// Checks an export string and, if it's a save the game can load, stores it
// as the current save. Returns a message for the player if it can't be used
// (the current save is then left alone), or nothing once it's stored.
export function importSave(text: string): string | undefined {
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
        // migrateSave only throws Errors
        return "That save couldn't be loaded: " + (error as Error).message + "."
    }

    localStorage.setItem("gameDataSave", JSON.stringify(save))
}

// The current game as text the player can copy and import later
export function exportSave(): string {
    return btoa(JSON.stringify(serializeGameData()))
}

// ---------------------------------------------------------------------------
// Versioned save format
//
// A save only holds the state that changes during play. Static game data
// (job/skill/item definitions and requirement definitions) is rebuilt by
// initGameData() in engine.ts on every load, and the save is then applied on
// top.
//
// Version history:
//   (none) - legacy format: the whole gameData object passed to JSON.stringify
//   2      - only mutable state, referring to jobs/skills/items by name
//   3      - the same, referring to everything by id (see data.ts)
//   4      - adds automation settings (auto-promote, auto-learn, skipped skills)
//   5      - adds the history of past lives and the peak purse of this life
// ---------------------------------------------------------------------------

export const SAVE_VERSION = 5

// What each version of a save looks like, as the game wrote it. A save read
// from storage or imported by the player is only checked as far as
// migrateSave() and applySaveData() check it, which is why applySaveData()
// checks every value before using it.

// A saved level, max level and xp; missing values keep their defaults
export interface SavedTask {
    level?: number
    maxLevel?: number
    xp?: number
}

// A reference to a job, skill, item or unlock: a display name in version 2,
// an id from version 3. Missing or unknown ones are skipped when loading.
type SavedRef = string | undefined

interface SaveFields<Version> {
    version: Version
    coins: number
    days: number
    evil: number
    paused: boolean
    timeWarpingEnabled: boolean
    rebirthOneCount: number
    rebirthTwoCount: number
    currentJob: SavedRef
    currentSkill: SavedRef
    currentProperty: SavedRef
    currentMisc: SavedRef[]
    tasks: Record<string, SavedTask> // by name in version 2, by id from 3
    completedRequirements: SavedRef[]
}

// The original game saved its whole gameData object
export interface LegacySave {
    version?: undefined
    coins: number
    days: number
    evil: number
    paused: boolean
    timeWarpingEnabled: boolean
    rebirthOneCount: number
    rebirthTwoCount: number
    currentJob: {name: string} | null
    currentSkill: {name: string} | null
    currentProperty: {name: string} | null
    currentMisc: ({name: string} | null)[]
    taskData: Record<string, SavedTask | null>
    requirements?: Record<string, {completed?: boolean} | null>
}
export type SaveV2 = SaveFields<2>
export type SaveV3 = SaveFields<3>
export interface SaveV4 extends SaveFields<4> {
    automation: {
        autoPromote: boolean
        autoLearn: boolean
        skippedSkills: string[] // skill ids
    }
}
export interface SaveV5 extends Omit<SaveV4, "version"> {
    version: 5
    lives: Life[] // jobs and skills by id, so renamed tasks still resolve
    lifePeakCoins: number
}
type AnySave = LegacySave | SaveV2 | SaveV3 | SaveV4 | SaveV5

export function serializeGameData(): SaveV5 {
    const tasks: Record<string, SavedTask> = {}
    for (const name in gameData.taskData) {
        const task = gameData.taskData[name]
        tasks[task.baseData.id] = {level: task.level, maxLevel: task.maxLevel, xp: task.xp}
    }

    const completedRequirements: string[] = []
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
        lives: gameData.lives.map(life => ({...life, job: {...life.job}, skill: {...life.skill}})),
        lifePeakCoins: gameData.lifePeakCoins,
    }
}

// Converts any supported save into the current format. Throws if the save
// can't be understood.
export function migrateSave(input: unknown): SaveV5 {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("Save is not an object")
    }
    // Its version says which of the formats it is; versions this game doesn't
    // know are rejected below
    let save = input as AnySave

    if (save.version === undefined) save = migrateLegacySave(save)
    if (save.version === 2) save = migrateV2ToV3(save)
    if (save.version === 3) save = migrateV3ToV4(save)
    if (save.version === 4) save = migrateV4ToV5(save)

    if (save.version > SAVE_VERSION) {
        throw new Error("Save is from a newer version of the game")
    }
    if (save.version !== SAVE_VERSION) {
        // A version none of the types above describe
        throw new Error("Unknown save version " + (save as {version: unknown}).version)
    }

    validateSave(save)
    return save
}

function migrateLegacySave(legacy: LegacySave): SaveV2 {
    if (typeof legacy.taskData !== "object" || legacy.taskData === null) {
        throw new Error("Legacy save has no task data")
    }

    const tasks: Record<string, SavedTask> = {}
    for (const name in legacy.taskData) {
        const task: SavedTask = legacy.taskData[name] || {}
        tasks[name] = {level: task.level, maxLevel: task.maxLevel, xp: task.xp}
    }

    const completedRequirements: string[] = []
    const requirements = legacy.requirements || {}
    for (const key in requirements) {
        const requirement = requirements[key]
        if (requirement && requirement.completed) completedRequirements.push(key)
    }

    const nameOf = function(entity: {name: string} | null): SavedRef {return entity ? entity.name : undefined}

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
function migrateV2ToV3(save: SaveV2): SaveV3 {
    const toId = (name: unknown): SavedRef => typeof name === "string" ? idsByName[name] : undefined
    const migrated: SaveV3 = Object.assign({}, save, {version: 3 as const})

    if (save.tasks && typeof save.tasks === "object") {
        const tasks: Record<string, SavedTask> = {}
        migrated.tasks = tasks
        for (const name in save.tasks) {
            const id = toId(name)
            if (id) tasks[id] = save.tasks[name]
        }
    }
    migrated.currentJob = toId(save.currentJob)
    migrated.currentSkill = toId(save.currentSkill)
    migrated.currentProperty = toId(save.currentProperty)
    for (const key of ["currentMisc", "completedRequirements"] as const) {
        if (Array.isArray(save[key])) migrated[key] = save[key].map(toId).filter(Boolean)
    }
    return migrated
}

// Version 3 didn't save automation settings, so they start switched off
function migrateV3ToV4(save: SaveV3): SaveV4 {
    return Object.assign({}, save, {
        version: 4 as const,
        automation: {autoPromote: false, autoLearn: false, skippedSkills: []},
    })
}

// Version 4 didn't keep a history, so it starts empty; the life in progress
// takes the coins held now as its peak so far
function migrateV4ToV5(save: SaveV4): SaveV5 {
    return Object.assign({}, save, {
        version: 5 as const,
        lives: [],
        lifePeakCoins: save.coins,
    })
}

function validateSave(save: SaveV5): void {
    for (const key of ["coins", "days"] as const) {
        if (!isFiniteNumber(save[key])) throw new Error("Save has an invalid " + key)
    }
    if (typeof save.tasks !== "object" || save.tasks === null) {
        throw new Error("Save has no task data")
    }
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && isFinite(value)
}

// Applies a current-format save on top of freshly initialised gameData.
// Anything the save doesn't have, or that no longer exists in the game,
// keeps its default value.
function applySaveData(save: SaveV5): void {
    for (const key of ["coins", "days", "evil", "rebirthOneCount", "rebirthTwoCount"] as const) {
        const value: unknown = save[key]
        if (isFiniteNumber(value)) gameData[key] = value
    }
    // A save that lacks it (or has nonsense) starts the peak from the coins held
    gameData.lifePeakCoins = isFiniteNumber(save.lifePeakCoins) && save.lifePeakCoins >= gameData.coins ? save.lifePeakCoins : gameData.coins
    if (Array.isArray(save.lives)) {
        gameData.lives = save.lives.map(readLife).filter((life): life is Life => life !== undefined).slice(-MAX_LIVES)
    }
    for (const key of ["paused", "timeWarpingEnabled"] as const) {
        const value: unknown = save[key]
        if (typeof value === "boolean") gameData[key] = value
    }

    for (const id in save.tasks) {
        const task = getTaskById(id)
        const savedTask = save.tasks[id]
        if (!task || !savedTask) continue
        for (const key of ["level", "maxLevel", "xp"] as const) {
            const value: unknown = savedTask[key]
            if (isFiniteNumber(value)) task[key] = value
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
            // A missing id (undefined) names nothing, so finds no requirement
            const requirement = gameData.requirements[namesById[id as string]]
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

// One saved life, or nothing if it is malformed. Ids are only checked to be
// text: a task the game no longer has is shown as unknown, not dropped.
function readLife(value: unknown): Life | undefined {
    if (value === null || typeof value !== "object") return undefined
    const life = value as Record<string, unknown>
    const job = readBest(life.job)
    const skill = readBest(life.skill)
    if (!job || !skill) return undefined
    if (!isCount(life.life) || life.life < 1 || !isCount(life.age) || !isCount(life.peakCoins) || !isCount(life.evil)) return undefined
    if (life.end !== "rebirth" && life.end !== "evil") return undefined
    // Saves don't date their lives yet; those without dates start at day 0
    const born = isFiniteNumber(life.born) ? life.born : 0
    const ended = isFiniteNumber(life.ended) ? life.ended : 0
    return {life: life.life, end: life.end as LifeEnd, age: life.age, job, skill, peakCoins: life.peakCoins, evil: life.evil, born, ended}
}

function readBest(value: unknown): Life["job"] | undefined {
    if (value === null || typeof value !== "object") return undefined
    const best = value as Record<string, unknown>
    if (typeof best.id !== "string" || !isCount(best.level)) return undefined
    return {id: best.id, level: best.level}
}

function isCount(value: unknown): value is number {
    return isFiniteNumber(value) && value >= 0
}

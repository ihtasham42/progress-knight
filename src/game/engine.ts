// The game itself: game steps, unlocks, rebirths and automation. The state
// is in state.ts and the formulas the classes share are in rules.ts.
// Nothing here touches the page (no document or window), so the game can
// also run without a browser. ui.js shows this state on the page.

import { jobs, skills, items, unlocks, events, startingItems, namesById, idsByName, jobBaseData, jobCategories, skillBaseData, itemBaseData } from "./data.ts"
import { gameData, MAX_LIVES } from "./state.ts"
import type { LifeBest, LifeEnd } from "./state.ts"
import { updateSpeed, getSourceEffect, applyStatBoosts, applySpeed, daysToYears, getLifespan } from "./rules.ts"
import { getEventEffect } from "./events.ts"
import { getWorldDay } from "./calendar.ts"
import { Job, Skill, Item, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement } from "./classes.ts"
import type { Requirement } from "./classes.ts"
import type { AnyDefinition, Boost, JobDefinition, SkillDefinition, ItemDefinition, TargetedStat,
    TaskRequirementSpec, CoinRequirementSpec, AgeRequirementSpec, EvilRequirementSpec } from "./types.ts"

export let skillWithLowestMaxXp: Skill | null = null

// Unlocks that stay unlocked through rebirths
const permanentUnlocks = unlocks.filter(unlock => unlock.permanent).map(unlock => unlock.name)

// undefined for an id that doesn't exist or is missing (e.g. in an old save).
// A missing id (undefined) names nothing, so finds nothing.
export function getTaskById(id: string | undefined): Job | Skill | undefined {
    return gameData.taskData[namesById[id as string]]
}

export function getItemById(id: string | undefined): Item | undefined {
    return gameData.itemData[namesById[id as string]]
}

// Wires up every xp, income and expense multiplier from the boosts declared
// in data.ts. Multipliers are applied from the broadest to the most specific
// ("all", then "jobs"/"skills"/"items", then a category or a single task),
// each group in definition order with skills before items, then events.
function addMultipliers() {
    for (const taskName in gameData.taskData) {
        const task = gameData.taskData[taskName]

        task.xpMultipliers = [task.getMaxLevelMultiplier.bind(task), getHappiness]
        task.xpMultipliers.push(...getBoostEffects("xp", task))
        // Dark magic is fuelled by evil
        if (task.baseData.category == "Dark magic") task.xpMultipliers.push(getEvil)

        if (task instanceof Job) {
            task.incomeMultipliers = [task.getLevelMultiplier.bind(task)]
            task.incomeMultipliers.push(...getBoostEffects("income", task))
        }
    }

    for (const itemName in gameData.itemData) {
        const item = gameData.itemData[itemName]
        item.expenseMultipliers = getBoostEffects("expense", item)
    }
}

const boostScopes = ["broad", "kind", "specific"]

function getBoostScope(target: string): string {
    if (target == "all") return "broad"
    if (["jobs", "skills", "items"].includes(target)) return "kind"
    return "specific"
}

function boostApplies(target: string, entity: Job | Skill | Item): boolean {
    if (target == "all") return true
    if (target == "jobs") return entity instanceof Job
    if (target == "skills") return entity instanceof Skill
    if (target == "items") return entity instanceof Item
    return entity.baseData.category == target || entity.baseData.id == target
}

// Effect functions of every skill, item and event that boosts stat for
// entity. An event's is 1 while the event isn't running.
function getBoostEffects(stat: TargetedStat, entity: Job | Skill | Item): (() => number)[] {
    // Only xp, income and expense boosts can match stat, and they always have
    // a target (types.ts)
    const matches = (boost: Boost, scope: string) =>
        boost.stat == stat && getBoostScope(boost.of as string) == scope && boostApplies(boost.of as string, entity)
    const effects: (() => number)[] = []
    for (const scope of boostScopes) {
        for (const source of [...skills, ...items]) {
            for (const boost of source.boosts || []) {
                if (matches(boost, scope)) effects.push(getSourceEffect(source))
            }
        }
        for (const event of events) {
            for (const effect of event.effects) {
                for (const boost of effect.boosts) {
                    if (matches(boost, scope)) effects.push(getEventEffect(event, effect))
                }
            }
        }
    }
    return effects
}

// A property's effect is always happiness, applied after other boosts
export function getHappiness() {
    return applyStatBoosts("happiness", 1) * gameData.currentProperty.getEffect()
}

function getEvil() {
    return gameData.evil
}

export function getEvilGain() {
    return applyStatBoosts("evilGain", 1)
}

function applyExpenses() {
    const coins = applySpeed(getExpense())
    gameData.coins -= coins
    if (gameData.coins < 0) {    
        goBankrupt()
    }
}

export function getExpense() {
    let expense = 0
    expense += gameData.currentProperty.getExpense()
    for (const misc of gameData.currentMisc) {
        expense += misc.getExpense()
    }
    return expense
}

function goBankrupt() {
    gameData.coins = 0
    // The starting property (checked in data.ts)
    gameData.currentProperty = getItemById(startingItems.property) as Item
    gameData.currentMisc = []
}

export function setPause() {
    gameData.paused = !gameData.paused
}

export function setTimeWarping() {
    gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled
}

export function setAutoPromote(enabled: boolean): void {
    gameData.automation.autoPromote = enabled
}

export function setAutoLearn(enabled: boolean): void {
    gameData.automation.autoLearn = enabled
}

export function setSkillSkipped(skillName: string, skipped: boolean): void {
    const id = idsByName[skillName]
    skipped ? gameData.automation.skippedSkills.add(id) : gameData.automation.skippedSkills.delete(id)
}

export function setTask(taskName: string): void {
    const task = gameData.taskData[taskName]
    task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task
}

export function setProperty(propertyName: string): void {
    const property = gameData.itemData[propertyName]
    gameData.currentProperty = property
}

export function setMisc(miscName: string): void {
    const misc = gameData.itemData[miscName]
    if (gameData.currentMisc.includes(misc)) {
        for (let i = 0; i < gameData.currentMisc.length; i++) {
            if (gameData.currentMisc[i] == misc) {
                gameData.currentMisc.splice(i, 1)
            }
        }
    } else {
        gameData.currentMisc.push(misc)
    }
}

function createData(data: Record<string, Job | Skill | Item>, baseData: Record<string, JobDefinition | SkillDefinition | ItemDefinition>): void {
    for (const key in baseData) {
        const entity = baseData[key]
        createEntity(data, entity)
    }
}

function createEntity(data: Record<string, Job | Skill | Item>, entity: JobDefinition | SkillDefinition | ItemDefinition): void {
    if ("income" in entity) {data[entity.name] = new Job(entity)}
    else if ("maxXp" in entity) {data[entity.name] = new Skill(entity)}
    else {data[entity.name] = new Item(entity)}
}

export function getNet() {
    const net = Math.abs(getIncome() - getExpense())
    return net
}

// Once reached, an unlock stays unlocked for the rest of the life (or for
// good, for permanent unlocks), so every requirement is checked each step.
function updateRequirements() {
    for (const key in gameData.requirements) {
        gameData.requirements[key].isCompleted()
    }
}

function doCurrentTask(task: Job | Skill): void {
    task.increaseXp()
    if (task instanceof Job) {
        increaseCoins()
    }
}

export function getIncome() {
    let income = 0
    income += gameData.currentJob.getIncome()
    return income
}

function increaseCoins() {
    const coins = applySpeed(getIncome())
    gameData.coins += coins
}

function getCategoryFromEntityName(categoryType: Record<string, string[]>, entityName: string): string[] | undefined {
    for (const categoryName in categoryType) {
        const category = categoryType[categoryName]
        if (category.includes(entityName)) {
            return category
        }
    }
}

function getNextEntity<T>(data: Record<string, T>, categoryType: Record<string, string[]>, entityName: string): T | null {
    // Every entity is in a category
    const category = getCategoryFromEntityName(categoryType, entityName) as string[]
    const nextIndex = category.indexOf(entityName) + 1
    if (nextIndex > category.length - 1) return null
    const nextEntityName = category[nextIndex]
    const nextEntity = data[nextEntityName]
    return nextEntity
}

export function autoPromote() {
    if (!gameData.automation.autoPromote) return
    const nextEntity = getNextEntity(gameData.taskData, jobCategories, gameData.currentJob.name)
    if (nextEntity == null) return
    const requirement = gameData.requirements[nextEntity.name]
    // The next entity in a job category is a job
    if (requirement.isCompleted()) gameData.currentJob = nextEntity as Job
}

function checkSkillSkipped(skill: Skill): boolean {
    return gameData.automation.skippedSkills.has(skill.baseData.id)
}

export function setSkillWithLowestMaxXp() {
    const xpDict: Record<string, number> = {}

    for (const skillName in gameData.taskData) {
        const skill = gameData.taskData[skillName]
        const requirement = gameData.requirements[skillName]
        if (skill instanceof Skill && requirement.isCompleted() && !checkSkillSkipped(skill)) {
            xpDict[skill.name] = skill.level //skill.getMaxXp() / skill.getXpGain()
        }
    }

    if (Object.keys(xpDict).length == 0) {
        // The starting skill (checked in data.ts)
        skillWithLowestMaxXp = getTaskById(startingItems.skill) as Skill
        return
    }

    // xpDict isn't empty, so there is a lowest key, and it's a skill
    const skillName = getKeyOfLowestValueFromDict(xpDict) as string
    skillWithLowestMaxXp = gameData.taskData[skillName] as Skill
}

function getKeyOfLowestValueFromDict(dict: Record<string, number>): string | undefined {
    const values: number[] = []
    for (const key in dict) {
        const value = dict[key]
        values.push(value)
    }

    values.sort(function(a, b){return a - b})

    for (const key in dict) {
        const value = dict[key]
        if (value == values[0]) {
            return key
        }
    }
}

export function autoLearn() {
    if (!gameData.automation.autoLearn || !skillWithLowestMaxXp) return
    gameData.currentSkill = skillWithLowestMaxXp
}

function increaseDays() {
    const increase = applySpeed(1)
    gameData.days += increase
}

// Builds every unlock requirement from the game data (see data.ts).
// Requirements are keyed by display name; specs in the data refer to
// other entities by id.
function createRequirements(): Record<string, Requirement> {
    const requirements: Record<string, Requirement> = {}
    for (const definition of [...unlocks, ...jobs, ...skills, ...items]) {
        requirements[definition.name] = createRequirement(definition)
    }
    return requirements
}

// The specs in one definition are all the same kind (types.ts, and checked
// below), so each branch knows which kind it has
export function createRequirement(definition: AnyDefinition): Requirement {
    const specs = definition.requires
    const types = new Set(specs.map(spec => Object.keys(spec).find(key => key != "level")))
    if (types.size > 1) throw new Error(definition.name + " mixes different kinds of requirement")

    if (specs.length == 0 || types.has("task")) {
        return new TaskRequirement((specs as readonly TaskRequirementSpec[]).map(function(spec) {
            if (!(spec.task in namesById)) throw new Error(definition.name + " requires unknown task " + spec.task)
            return {task: namesById[spec.task], requirement: spec.level}
        }))
    }
    if (types.has("coins")) return new CoinRequirement((specs as readonly CoinRequirementSpec[]).map(spec => ({requirement: spec.coins})))
    if (types.has("age")) return new AgeRequirement((specs as readonly AgeRequirementSpec[]).map(spec => ({requirement: spec.age})))
    if (types.has("evil")) return new EvilRequirement((specs as readonly EvilRequirementSpec[]).map(spec => ({requirement: spec.evil})))
    throw new Error(definition.name + " has an unknown kind of requirement")
}

// Builds the game state for a new game, before any save is applied
export function initGameData() {
    createData(gameData.taskData, jobBaseData)
    createData(gameData.taskData, skillBaseData)
    createData(gameData.itemData, itemBaseData) 

    // The starting ids are a job, a skill and a property (checked in data.ts)
    gameData.currentJob = getTaskById(startingItems.job) as Job
    gameData.currentSkill = getTaskById(startingItems.skill) as Skill
    gameData.currentProperty = getItemById(startingItems.property) as Item
    gameData.currentMisc = []

    gameData.requirements = createRequirements()

    addMultipliers()
}

// The highest level any job (or skill) has reached in this life. The first
// one wins a tie, and a life without levels gives the first of them.
export function getBestOfLife(kind: typeof Job | typeof Skill): LifeBest {
    let best: Job | Skill | undefined
    for (const taskName in gameData.taskData) {
        const task = gameData.taskData[taskName]
        if (task instanceof kind && (!best || task.level > best.level)) best = task
    }
    return {id: (best as Job | Skill).baseData.id, level: (best as Job | Skill).level}
}

// The most coins held in this life, counting those held right now
export function getLifePeakCoins(): number {
    return Math.max(gameData.lifePeakCoins, gameData.coins)
}

// The furthest world day any life has reached, counting today. Kept apart
// from the lives, since the oldest of those are dropped.
export function getFurthestDay(): number {
    return Math.max(gameData.furthestDay, getWorldDay())
}

// Writes the life that is ending into the history, before the reset
function recordLife(end: LifeEnd, evil: number): void {
    gameData.lives.push({
        life: gameData.rebirthOneCount + gameData.rebirthTwoCount + 1,
        end: end,
        age: daysToYears(gameData.days),
        job: getBestOfLife(Job),
        skill: getBestOfLife(Skill),
        peakCoins: getLifePeakCoins(),
        evil: evil,
    })
    gameData.furthestDay = getFurthestDay()
    if (gameData.lives.length > MAX_LIVES) gameData.lives.splice(0, gameData.lives.length - MAX_LIVES)
}

export function rebirthOne() {
    recordLife("rebirth", 0)
    gameData.rebirthOneCount += 1

    rebirthReset()
}

export function rebirthTwo() {
    const evilGain = getEvilGain()
    recordLife("evil", evilGain)
    gameData.rebirthTwoCount += 1
    gameData.evil += evilGain

    rebirthReset()

    for (const taskName in gameData.taskData) {
        const task = gameData.taskData[taskName]
        task.maxLevel = 0
    }    
}

// The next life wakes at 14 on the wake day, like every life
function rebirthReset() {
    gameData.coins = 0
    gameData.lifePeakCoins = 0
    gameData.days = 365 * 14
    // The starting ids are a job, a skill and a property (checked in data.ts)
    gameData.currentJob = getTaskById(startingItems.job) as Job
    gameData.currentSkill = getTaskById(startingItems.skill) as Skill
    gameData.currentProperty = getItemById(startingItems.property) as Item
    gameData.currentMisc = []

    for (const taskName in gameData.taskData) {
        const task = gameData.taskData[taskName]
        if (task.level > task.maxLevel) task.maxLevel = task.level
        task.level = 0
        task.xp = 0
    }

    for (const key in gameData.requirements) {
        const requirement = gameData.requirements[key]
        if (requirement.completed && permanentUnlocks.includes(key)) continue
        requirement.completed = false
    }
}

// Whether an unlock (by id, see data.ts) has been reached. Only reads the
// state; game steps record unlocks as they are reached.
export function isUnlocked(unlockId: string): boolean {
    return gameData.requirements[namesById[unlockId]].completed
}

// Like isAlive(), but never changes the game state
export function isLifeOver() {
    return gameData.days >= getLifespan()
}

export function update() {
    increaseDays()
    autoPromote()
    autoLearn()
    doCurrentTask(gameData.currentJob)
    doCurrentTask(gameData.currentSkill)
    applyExpenses()
    updateRequirements()
    // Only watch the coins and the date; they change nothing the game uses
    gameData.lifePeakCoins = getLifePeakCoins()
    gameData.furthestDay = getFurthestDay()
}

// The game always advances in fixed steps of 1 / updateSpeed seconds, however
// often it is called, so the maths of each step never changes.
const stepDuration = 1000 / updateSpeed

// After a long gap (a sleeping laptop, a throttled background tab) catch up
// at most this much game time at once and drop the rest, so the page never
// freezes.
export const MAX_CATCH_UP_MS = 20 * 1000

// Real time (ms) that hasn't been turned into game steps yet
export let unsteppedTime = 0

// Runs one game step for every step's worth of real time that has passed,
// up to MAX_CATCH_UP_MS. Returns the number of steps run.
export function advanceGameTime(elapsedMs: number): number {
    unsteppedTime += Math.max(elapsedMs, 0)
    let steps = Math.floor(unsteppedTime / stepDuration)
    const maxSteps = Math.floor(MAX_CATCH_UP_MS / stepDuration)
    if (steps > maxSteps) {
        steps = maxSteps
        unsteppedTime = 0
    } else {
        unsteppedTime -= steps * stepDuration
    }
    for (let i = 0; i < steps; i++) {
        update()
    }
    return steps
}

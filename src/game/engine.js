"use strict"

// The game itself: game steps, unlocks, rebirths and automation. The state
// is in state.js and the formulas the classes share are in rules.js.
// Nothing here touches the page (no document or window), so the game can
// also run without a browser. ui.js shows this state on the page.

let skillWithLowestMaxXp = null

// Unlocks that stay unlocked through rebirths
const permanentUnlocks = unlocks.filter(unlock => unlock.permanent).map(unlock => unlock.name)

function getTaskById(id) {
    return gameData.taskData[namesById[id]]
}

function getItemById(id) {
    return gameData.itemData[namesById[id]]
}

// Wires up every xp, income and expense multiplier from the boosts declared
// in data.js. Multipliers are applied from the broadest to the most specific
// ("all", then "jobs"/"skills"/"items", then a category or a single task),
// each group in definition order with skills before items.
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

function getBoostScope(target) {
    if (target == "all") return "broad"
    if (["jobs", "skills", "items"].includes(target)) return "kind"
    return "specific"
}

function boostApplies(target, entity) {
    if (target == "all") return true
    if (target == "jobs") return entity instanceof Job
    if (target == "skills") return entity instanceof Skill
    if (target == "items") return entity instanceof Item
    return entity.baseData.category == target || entity.baseData.id == target
}

// Effect functions of every skill and item that boosts stat for entity
function getBoostEffects(stat, entity) {
    const effects = []
    for (const scope of boostScopes) {
        for (const source of [...skills, ...items]) {
            for (const boost of source.boosts || []) {
                if (boost.stat == stat && getBoostScope(boost.of) == scope && boostApplies(boost.of, entity)) {
                    effects.push(getSourceEffect(source))
                }
            }
        }
    }
    return effects
}

// A property's effect is always happiness, applied after other boosts
function getHappiness() {
    return applyStatBoosts("happiness", 1) * gameData.currentProperty.getEffect()
}

function getEvil() {
    return gameData.evil
}

function getEvilGain() {
    return applyStatBoosts("evilGain", 1)
}

function applyExpenses() {
    const coins = applySpeed(getExpense())
    gameData.coins -= coins
    if (gameData.coins < 0) {    
        goBankrupt()
    }
}

function getExpense() {
    let expense = 0
    expense += gameData.currentProperty.getExpense()
    for (const misc of gameData.currentMisc) {
        expense += misc.getExpense()
    }
    return expense
}

function goBankrupt() {
    gameData.coins = 0
    gameData.currentProperty = getItemById(startingItems.property)
    gameData.currentMisc = []
}

function setPause() {
    gameData.paused = !gameData.paused
}

function setTimeWarping() {
    gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled
}

function setAutoPromote(enabled) {
    gameData.automation.autoPromote = enabled
}

function setAutoLearn(enabled) {
    gameData.automation.autoLearn = enabled
}

function setSkillSkipped(skillName, skipped) {
    const id = idsByName[skillName]
    skipped ? gameData.automation.skippedSkills.add(id) : gameData.automation.skippedSkills.delete(id)
}

function setTask(taskName) {
    const task = gameData.taskData[taskName]
    task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task
}

function setProperty(propertyName) {
    const property = gameData.itemData[propertyName]
    gameData.currentProperty = property
}

function setMisc(miscName) {
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

function createData(data, baseData) {
    for (const key in baseData) {
        const entity = baseData[key]
        createEntity(data, entity)
    }
}

function createEntity(data, entity) {
    if ("income" in entity) {data[entity.name] = new Job(entity)}
    else if ("maxXp" in entity) {data[entity.name] = new Skill(entity)}
    else {data[entity.name] = new Item(entity)}
}

function getNet() {
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

function doCurrentTask(task) {
    task.increaseXp()
    if (task instanceof Job) {
        increaseCoins()
    }
}

function getIncome() {
    let income = 0
    income += gameData.currentJob.getIncome()
    return income
}

function increaseCoins() {
    const coins = applySpeed(getIncome())
    gameData.coins += coins
}

function getCategoryFromEntityName(categoryType, entityName) {
    for (const categoryName in categoryType) {
        const category = categoryType[categoryName]
        if (category.includes(entityName)) {
            return category
        }
    }
}

function getNextEntity(data, categoryType, entityName) {
    const category = getCategoryFromEntityName(categoryType, entityName)
    const nextIndex = category.indexOf(entityName) + 1
    if (nextIndex > category.length - 1) return null
    const nextEntityName = category[nextIndex]
    const nextEntity = data[nextEntityName]
    return nextEntity
}

function autoPromote() {
    if (!gameData.automation.autoPromote) return
    const nextEntity = getNextEntity(gameData.taskData, jobCategories, gameData.currentJob.name)
    if (nextEntity == null) return
    const requirement = gameData.requirements[nextEntity.name]
    if (requirement.isCompleted()) gameData.currentJob = nextEntity
}

function checkSkillSkipped(skill) {
    return gameData.automation.skippedSkills.has(skill.baseData.id)
}

function setSkillWithLowestMaxXp() {
    const xpDict = {}

    for (const skillName in gameData.taskData) {
        const skill = gameData.taskData[skillName]
        const requirement = gameData.requirements[skillName]
        if (skill instanceof Skill && requirement.isCompleted() && !checkSkillSkipped(skill)) {
            xpDict[skill.name] = skill.level //skill.getMaxXp() / skill.getXpGain()
        }
    }

    if (Object.keys(xpDict).length == 0) {
        skillWithLowestMaxXp = getTaskById(startingItems.skill)
        return
    }

    const skillName = getKeyOfLowestValueFromDict(xpDict)
    skillWithLowestMaxXp = gameData.taskData[skillName]
}

function getKeyOfLowestValueFromDict(dict) {
    const values = []
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

function autoLearn() {
    if (!gameData.automation.autoLearn || !skillWithLowestMaxXp) return
    gameData.currentSkill = skillWithLowestMaxXp
}

function yearsToDays(years) {
    const days = years * 365
    return days
}

function getDay() {
    const day = Math.floor(gameData.days - daysToYears(gameData.days) * 365)
    return day
}

function increaseDays() {
    const increase = applySpeed(1)
    gameData.days += increase
}

// Builds every unlock requirement from the game data (see data.js).
// Requirements are keyed by display name; specs in the data refer to
// other entities by id.
function createRequirements() {
    const requirements = {}
    for (const definition of [...unlocks, ...jobs, ...skills, ...items]) {
        requirements[definition.name] = createRequirement(definition)
    }
    return requirements
}

function createRequirement(definition) {
    const specs = definition.requires
    const types = new Set(specs.map(spec => Object.keys(spec).find(key => key != "level")))
    if (types.size > 1) throw new Error(definition.name + " mixes different kinds of requirement")

    if (specs.length == 0 || types.has("task")) {
        return new TaskRequirement(specs.map(function(spec) {
            if (!(spec.task in namesById)) throw new Error(definition.name + " requires unknown task " + spec.task)
            return {task: namesById[spec.task], requirement: spec.level}
        }))
    }
    if (types.has("coins")) return new CoinRequirement(specs.map(spec => ({requirement: spec.coins})))
    if (types.has("age")) return new AgeRequirement(specs.map(spec => ({requirement: spec.age})))
    if (types.has("evil")) return new EvilRequirement(specs.map(spec => ({requirement: spec.evil})))
    throw new Error(definition.name + " has an unknown kind of requirement")
}

// Builds the game state for a new game, before any save is applied
function initGameData() {
    createData(gameData.taskData, jobBaseData)
    createData(gameData.taskData, skillBaseData)
    createData(gameData.itemData, itemBaseData) 

    gameData.currentJob = getTaskById(startingItems.job)
    gameData.currentSkill = getTaskById(startingItems.skill)
    gameData.currentProperty = getItemById(startingItems.property)
    gameData.currentMisc = []

    gameData.requirements = createRequirements()

    addMultipliers()
}

function rebirthOne() {
    gameData.rebirthOneCount += 1

    rebirthReset()
}

function rebirthTwo() {
    gameData.rebirthTwoCount += 1
    gameData.evil += getEvilGain()

    rebirthReset()

    for (const taskName in gameData.taskData) {
        const task = gameData.taskData[taskName]
        task.maxLevel = 0
    }    
}

function rebirthReset() {
    gameData.coins = 0
    gameData.days = 365 * 14
    gameData.currentJob = getTaskById(startingItems.job)
    gameData.currentSkill = getTaskById(startingItems.skill)
    gameData.currentProperty = getItemById(startingItems.property)
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

// Like isAlive(), but never changes the game state
function isLifeOver() {
    return gameData.days >= getLifespan()
}

function update() {
    increaseDays()
    autoPromote()
    autoLearn()
    doCurrentTask(gameData.currentJob)
    doCurrentTask(gameData.currentSkill)
    applyExpenses()
    updateRequirements()
}

// The game always advances in fixed steps of 1 / updateSpeed seconds, however
// often it is called, so the maths of each step never changes.
const stepDuration = 1000 / updateSpeed

// After a long gap (a sleeping laptop, a throttled background tab) catch up
// at most this much game time at once and drop the rest, so the page never
// freezes.
const MAX_CATCH_UP_MS = 20 * 1000

// Real time (ms) that hasn't been turned into game steps yet
let unsteppedTime = 0

// Runs one game step for every step's worth of real time that has passed,
// up to MAX_CATCH_UP_MS. Returns the number of steps run.
function advanceGameTime(elapsedMs) {
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

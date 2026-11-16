"use strict"

// The game itself: its state, formulas, game steps, rebirths and automation.
// Nothing here touches the page (no document or window), so the game can
// also run without a browser. ui.js shows this state on the page.

const gameData = {
    taskData: {},
    itemData: {},

    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,

    rebirthOneCount: 0,
    rebirthTwoCount: 0,

    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: null,

    // Not saved yet
    automation: {
        autoPromote: false,
        autoLearn: false,
        skippedSkills: new Set(), // skill ids
    },
}

let skillWithLowestMaxXp = null

const updateSpeed = 20

const baseLifespan = 365 * 70

const baseGameSpeed = 4

// Unlocks that stay unlocked through rebirths
const permanentUnlocks = unlocks.filter(unlock => unlock.permanent).map(unlock => unlock.name)

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

function getTaskById(id) {
    return gameData.taskData[namesById[id]]
}

function getItemById(id) {
    return gameData.itemData[namesById[id]]
}

function getBindedTaskEffect(taskName) {
    const task = gameData.taskData[taskName]
    return task.getEffect.bind(task)
}

function getBindedItemEffect(itemName) {
    const item = gameData.itemData[itemName]
    return item.getEffect.bind(item)
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

function getSourceEffect(source) {
    return source.name in gameData.taskData ? getBindedTaskEffect(source.name) : getBindedItemEffect(source.name)
}

// A property's effect is always happiness, applied after other boosts
function getHappiness() {
    return applyStatBoosts("happiness", 1) * gameData.currentProperty.getEffect()
}

// Multiplies value by the effect of every skill and item that boosts a
// global stat (happiness, lifespan, gameSpeed, evilGain), in definition order
function applyStatBoosts(stat, value) {
    for (const source of [...skills, ...items]) {
        for (const boost of source.boosts || []) {
            if (boost.stat == stat) value *= getSourceEffect(source)()
        }
    }
    return value
}

function getEvil() {
    return gameData.evil
}

function applyMultipliers(value, multipliers) {
    let finalMultiplier = 1
    multipliers.forEach(function(multiplierFunction) {
        const multiplier = multiplierFunction()
        finalMultiplier *= multiplier
    })
    const finalValue = Math.round(value * finalMultiplier)
    return finalValue
}

function applySpeed(value) {
    return value * getGameSpeed() / updateSpeed
}

function getEvilGain() {
    return applyStatBoosts("evilGain", 1)
}

function getGameSpeed() {
    const timeWarpingSpeed = gameData.timeWarpingEnabled ? applyStatBoosts("gameSpeed", 1) : 1
    const gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed
    return gameSpeed
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

function daysToYears(days) {
    const years = Math.floor(days / 365)
    return years
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

function getLifespan() {
    return applyStatBoosts("lifespan", baseLifespan)
}

// Also stops the age going past the lifespan
function isAlive() {
    const condition = gameData.days < getLifespan()
    if (!condition) {
        gameData.days = getLifespan()
    }
    return condition
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

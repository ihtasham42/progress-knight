"use strict"

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

const autoPromoteElement = document.getElementById("autoPromote")
const autoLearnElement = document.getElementById("autoLearn")

const updateSpeed = 20

const baseLifespan = 365 * 70

const baseGameSpeed = 4

// Unlocks that stay unlocked through rebirths
const permanentUnlocks = unlocks.filter(unlock => unlock.permanent).map(unlock => unlock.name)

const units = ["", "k", "M", "B", "T", "q", "Q", "Sx", "Sp", "Oc"];

const jobTabButton = document.getElementById("jobTabButton")

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

function setTab(element, selectedTab) {

    const tabs = Array.prototype.slice.call(document.getElementsByClassName("tab"))
    tabs.forEach(function(tab) {
        tab.style.display = "none"
    })
    document.getElementById(selectedTab).style.display = "block"

    const tabButtons = document.getElementsByClassName("tabButton")
    for (const tabButton of tabButtons) {
        tabButton.classList.remove("w3-blue-gray")
    }
    element.classList.add("w3-blue-gray")
}

// Rebirths seen by the page so far, so it can go back to the jobs tab after one
let shownRebirthCount = null

function updateTabAfterRebirth() {
    const rebirthCount = gameData.rebirthOneCount + gameData.rebirthTwoCount
    if (shownRebirthCount !== null && rebirthCount != shownRebirthCount) {
        setTab(jobTabButton, "jobs")
    }
    shownRebirthCount = rebirthCount
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
    data[entity.name].id = "row " + entity.name
}

function createRequiredRow(categoryName) {
    const requiredRow = document.getElementsByClassName("requiredRowTemplate")[0].content.firstElementChild.cloneNode(true)
    requiredRow.classList.add("requiredRow")
    requiredRow.classList.add(removeSpaces(categoryName))
    requiredRow.id = categoryName
    return requiredRow
}

function createHeaderRow(templates, categoryType, categoryName) {
    const headerRow = templates.headerRow.content.firstElementChild.cloneNode(true)
    headerRow.getElementsByClassName("category")[0].textContent = categoryName
    if (categoryType != itemCategories) {
        headerRow.getElementsByClassName("valueType")[0].textContent = categoryType == jobCategories ? "Income/day" : "Effect"
    }

    headerRow.style.backgroundColor = headerRowColors[categoryName]
    headerRow.style.color = "#ffffff"
    headerRow.classList.add(removeSpaces(categoryName))
    headerRow.classList.add("headerRow")
    
    return headerRow
}

function createRow(templates, name, categoryName, categoryType) {
    const row = templates.row.content.firstElementChild.cloneNode(true)
    row.getElementsByClassName("name")[0].textContent = name
    row.getElementsByClassName("tooltipText")[0].textContent = tooltips[name]
    row.id = "row " + name
    if (categoryType != itemCategories) {
        row.getElementsByClassName("progressBar")[0].onclick = function() {setTask(name)}
    } else {
        row.getElementsByClassName("button")[0].onclick = categoryName == "Properties" ? function() {setProperty(name)} : function() {setMisc(name)}
    }
    if (categoryType == skillCategories) {
        const skipCheckbox = row.getElementsByClassName("checkbox")[0]
        skipCheckbox.onchange = function() {setSkillSkipped(name, skipCheckbox.checked)}
    }

    return row
}

function createAllRows(categoryType, tableId) {
    const templates = {
        headerRow: document.getElementsByClassName(categoryType == itemCategories ? "headerRowItemTemplate" : "headerRowTaskTemplate")[0],
        row: document.getElementsByClassName(categoryType == itemCategories ? "rowItemTemplate" : "rowTaskTemplate")[0],
    }

    const table = document.getElementById(tableId)

    for (const categoryName in categoryType) {
        const headerRow = createHeaderRow(templates, categoryType, categoryName)
        table.appendChild(headerRow)
        
        const category = categoryType[categoryName]
        category.forEach(function(name) {
            const row = createRow(templates, name, categoryName, categoryType)
            table.appendChild(row)       
        })

        const requiredRow = createRequiredRow(categoryName)
        table.append(requiredRow)
    }
}

function updateQuickTaskDisplay(taskType) {
    const currentTask = taskType == "job" ? gameData.currentJob : gameData.currentSkill
    const quickTaskDisplayElement = document.getElementById("quickTaskDisplay")
    const progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0]
    progressBar.getElementsByClassName("name")[0].textContent = currentTask.name + " lvl " + currentTask.level
    progressBar.getElementsByClassName("progressFill")[0].style.width = currentTask.xp / currentTask.getMaxXp() * 100 + "%"
}

function updateRequiredRows(data, categoryType) {
    const requiredRows = document.getElementsByClassName("requiredRow")
    for (const requiredRow of requiredRows) {
        let nextEntity = null
        const category = categoryType[requiredRow.id] 
        if (category == null) {continue}
        for (let i = 0; i < category.length; i++) {
            const entityName = category[i]
            if (i >= category.length - 1) break
            const requirements = gameData.requirements[entityName]
            if (requirements && i == 0) {
                if (!requirements.completed) {
                    nextEntity = data[entityName]
                    break
                }
            }

            const nextIndex = i + 1
            if (nextIndex >= category.length) {break}
            const nextEntityName = category[nextIndex]
            const nextEntityRequirements = gameData.requirements[nextEntityName]

            if (!nextEntityRequirements.completed) {
                nextEntity = data[nextEntityName]
                break
            }       
        }

        if (nextEntity == null) {
            requiredRow.classList.add("hiddenTask")           
        } else {
            requiredRow.classList.remove("hiddenTask")
            const requirementObject = gameData.requirements[nextEntity.name]
            const requirements = requirementObject.requirements

            const coinElement = requiredRow.getElementsByClassName("coins")[0]
            const levelElement = requiredRow.getElementsByClassName("levels")[0]
            const evilElement = requiredRow.getElementsByClassName("evil")[0]

            coinElement.classList.add("hiddenTask")
            levelElement.classList.add("hiddenTask")
            evilElement.classList.add("hiddenTask")

            let finalText = ""
            if (data == gameData.taskData) {
                if (requirementObject instanceof EvilRequirement) {
                    evilElement.classList.remove("hiddenTask")
                    evilElement.textContent = format(requirements[0].requirement) + " evil"
                } else {
                    levelElement.classList.remove("hiddenTask")
                    for (const requirement of requirements) {
                        const task = gameData.taskData[requirement.task]
                        if (task.level >= requirement.requirement) continue
                        const text = " " + requirement.task + " level " + format(task.level) + "/" + format(requirement.requirement) + ","
                        finalText += text
                    }
                    finalText = finalText.substring(0, finalText.length - 1)
                    levelElement.textContent = finalText
                }
            } else if (data == gameData.itemData) {
                coinElement.classList.remove("hiddenTask")
                formatCoins(requirements[0].requirement, coinElement)
            }
        }   
    }
}

function updateTaskRows() {
    for (const key in gameData.taskData) {
        const task = gameData.taskData[key]
        const row = document.getElementById("row " + task.name)
        row.getElementsByClassName("level")[0].textContent = task.level
        row.getElementsByClassName("xpGain")[0].textContent = format(task.getXpGain())
        row.getElementsByClassName("xpLeft")[0].textContent = format(task.getXpLeft())

        const maxLevel = row.getElementsByClassName("maxLevel")[0]
        maxLevel.textContent = task.maxLevel
        gameData.rebirthOneCount > 0 ? maxLevel.classList.remove("hidden") : maxLevel.classList.add("hidden")

        const progressFill = row.getElementsByClassName("progressFill")[0]
        progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%"
        task == gameData.currentJob || task == gameData.currentSkill ? progressFill.classList.add("current") : progressFill.classList.remove("current")

        const valueElement = row.getElementsByClassName("value")[0]
        valueElement.getElementsByClassName("income")[0].style.display = task instanceof Job
        valueElement.getElementsByClassName("effect")[0].style.display = task instanceof Skill

        const skipSkillElement = row.getElementsByClassName("skipSkill")[0]
        skipSkillElement.style.display = task instanceof Skill && gameData.automation.autoLearn ? "block" : "none"

        if (task instanceof Job) {
            formatCoins(task.getIncome(), valueElement.getElementsByClassName("income")[0])
        } else {
            valueElement.getElementsByClassName("effect")[0].textContent = task.getEffectDescription()
        }
    }
}

function updateItemRows() {
    for (const key in gameData.itemData) {
        const item = gameData.itemData[key]
        const row = document.getElementById("row " + item.name)
        const button = row.getElementsByClassName("button")[0]
        button.disabled = gameData.coins < item.getExpense()
        const active = row.getElementsByClassName("active")[0]
        const color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"]
        active.style.backgroundColor = gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white"
        row.getElementsByClassName("effect")[0].textContent = item.getEffectDescription()
        formatCoins(item.getExpense(), row.getElementsByClassName("expense")[0])
    }
}

function updateHeaderRows(categories) {
    for (const categoryName in categories) {
        const className = removeSpaces(categoryName)
        const headerRow = document.getElementsByClassName(className)[0]
        const maxLevelElement = headerRow.getElementsByClassName("maxLevel")[0]
        gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove("hidden") : maxLevelElement.classList.add("hidden")
        const skipSkillElement = headerRow.getElementsByClassName("skipSkill")[0]
        skipSkillElement.style.display = categories == skillCategories && gameData.automation.autoLearn ? "block" : "none"
    }
}

function updateText() {
    //Sidebar
    document.getElementById("ageDisplay").textContent = daysToYears(gameData.days)
    document.getElementById("dayDisplay").textContent = getDay()
    document.getElementById("lifespanDisplay").textContent = daysToYears(getLifespan())
    document.getElementById("pauseButton").textContent = gameData.paused ? "Play" : "Pause"

    formatCoins(gameData.coins, document.getElementById("coinDisplay"))
    setSignDisplay()
    formatCoins(getNet(), document.getElementById("netDisplay"))
    formatCoins(getIncome(), document.getElementById("incomeDisplay"))
    formatCoins(getExpense(), document.getElementById("expenseDisplay"))

    document.getElementById("happinessDisplay").textContent = getHappiness().toFixed(1)

    document.getElementById("evilDisplay").textContent = gameData.evil.toFixed(1)
    document.getElementById("evilGainDisplay").textContent = getEvilGain().toFixed(1)

    document.getElementById("timeWarpingDisplay").textContent = "x" + getTaskById("time_warping").getEffect().toFixed(2)
    document.getElementById("timeWarpingButton").textContent = gameData.timeWarpingEnabled ? "Disable warp" : "Enable warp"

    const deathText = document.getElementById("deathText")
    isLifeOver() ? deathText.classList.remove("hidden") : deathText.classList.add("hidden")
}

function setSignDisplay() {
    const signDisplay = document.getElementById("signDisplay")
    if (getIncome() > getExpense()) {
        signDisplay.textContent = "+"
        signDisplay.style.color = "green"
    } else if (getExpense() > getIncome()) {
        signDisplay.textContent = "-"
        signDisplay.style.color = "red"
    } else {
        signDisplay.textContent = ""
        signDisplay.style.color = "gray"
    }
}

function getNet() {
    const net = Math.abs(getIncome() - getExpense())
    return net
}

function hideEntities() {
    for (const key in requirementElements) {
        const completed = gameData.requirements[key].completed
        for (const element of requirementElements[key]) {
            if (completed) {
                element.classList.remove("hidden")
            } else {
                element.classList.add("hidden")
            }
        }
    }
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

function format(number) {
    number = Number(number)
    if (!isFinite(number)) return String(number)

    const sign = number < 0 ? "-" : ""
    const abs = Math.abs(number)

    // what tier? (determines SI symbol) - computed without log10 to avoid float error at exact powers of 1000
    let tier = 0
    while (abs >= Math.pow(1000, tier + 1)) tier++

    // below 1000 (including 0, fractions and small negatives) no suffix is needed
    if (tier == 0) return number

    // beyond the last named suffix fall back to scientific notation
    if (tier >= units.length) return sign + abs.toExponential(2)

    let scaled = abs / Math.pow(1000, tier)
    // avoid displaying e.g. "1000.0k" when rounding pushes into the next tier
    if (scaled.toFixed(1) == "1000.0" && tier + 1 < units.length) {
        tier++
        scaled = abs / Math.pow(1000, tier)
    }

    return sign + scaled.toFixed(1) + units[tier]
}

function formatCoins(coins, element) {
    const tiers = ["p", "g", "s"]
    const colors = {
        "p": "#79b9c7",
        "g": "#E5C100",
        "s": "#a8a8a8",
        "c": "#a15c2f"
    }
    let leftOver = coins
    let i = 0
    for (const tier of tiers) {
        const x = Math.floor(leftOver / Math.pow(10, (tiers.length - i) * 2))
        leftOver = Math.floor(leftOver - x * Math.pow(10, (tiers.length - i) * 2))
        const text = format(String(x)) + tier + " "
        element.children[i].textContent = x > 0 ? text : ""
        element.children[i].style.color = colors[tier]
        i += 1
    }
    if (leftOver == 0 && coins > 0) {element.children[3].textContent = ""; return}
    const copperText = String(Math.floor(leftOver)) + "c"
    element.children[3].textContent = copperText
    element.children[3].style.color = colors["c"]
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

// Requirement key -> the page elements shown once it is completed
let requirementElements = {}

function createRequirementElements() {
    const elements = {}
    for (const unlock of unlocks) {
        elements[unlock.name] = unlock.category ? Array.from(getElementsByClass(unlock.category)) : [document.getElementById(unlock.elementId)]
    }
    for (const definition of [...jobs, ...skills]) {
        elements[definition.name] = [getTaskElement(definition.name)]
    }
    for (const definition of items) {
        elements[definition.name] = [getItemElement(definition.name)]
    }
    return elements
}

function getTaskElement(taskName) {
    const task = gameData.taskData[taskName]
    const element = document.getElementById(task.id)
    return element
}

function getItemElement(itemName) {
    const item = gameData.itemData[itemName]
    const element = document.getElementById(item.id)
    return element
}

function getElementsByClass(className) {
    const elements = document.getElementsByClassName(removeSpaces(className))
    return elements
}

// Browsers can restore ticked checkboxes when the page is reloaded, so start
// from whatever the checkboxes show.
function setUpAutomationControls() {
    setAutoPromote(autoPromoteElement.checked)
    setAutoLearn(autoLearnElement.checked)
    autoPromoteElement.onchange = function() {setAutoPromote(autoPromoteElement.checked)}
    autoLearnElement.onchange = function() {setAutoLearn(autoLearnElement.checked)}
}

function setLightDarkMode() {
    const body = document.getElementById("body")
    body.classList.contains("dark") ? body.classList.remove("dark") : body.classList.add("dark")
}

function removeSpaces(string) {
    return string.replace(/ /g, "")
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

function updateUI() {
    updateTaskRows()
    updateItemRows()
    updateRequiredRows(gameData.taskData, jobCategories)
    updateRequiredRows(gameData.taskData, skillCategories)
    updateRequiredRows(gameData.itemData, itemCategories)
    updateHeaderRows(jobCategories)
    updateHeaderRows(skillCategories)
    updateQuickTaskDisplay("job")
    updateQuickTaskDisplay("skill")
    hideEntities()
    updateText()  
    updateTabAfterRebirth()
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

// About 10 frames per second is plenty for numbers and progress bars
const renderInterval = 100
let lastRenderTime = -Infinity

function renderFrame(now) {
    if (now - lastRenderTime >= renderInterval) {
        lastRenderTime = now
        updateUI()
    }
    requestAnimationFrame(renderFrame)
}

//Init

createAllRows(jobCategories, "jobTable")
createAllRows(skillCategories, "skillTable")
createAllRows(itemCategories, "itemTable") 
setUpAutomationControls()

createData(gameData.taskData, jobBaseData)
createData(gameData.taskData, skillBaseData)
createData(gameData.itemData, itemBaseData) 

gameData.currentJob = getTaskById(startingItems.job)
gameData.currentSkill = getTaskById(startingItems.skill)
gameData.currentProperty = getItemById(startingItems.property)
gameData.currentMisc = []

gameData.requirements = createRequirements()
requirementElements = createRequirementElements()

loadGameData()

addMultipliers()

setTab(jobTabButton, "jobs")

update()
updateUI()
setInterval(update, 1000 / updateSpeed)
requestAnimationFrame(renderFrame)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)
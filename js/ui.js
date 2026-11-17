"use strict"

// The page: building the rows, showing the game state, and the handlers
// that turn clicks into changes to that state. Rendering only reads the
// game state; it never changes it.

const autoPromoteElement = document.getElementById("autoPromote")
const autoLearnElement = document.getElementById("autoLearn")

const units = ["", "k", "M", "B", "T", "q", "Q", "Sx", "Sp", "Oc"];

const jobTabButton = document.getElementById("jobTabButton")

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

// Elements that rendering writes to, looked up once when the page is built
const taskRowElements = {} // task name -> elements in its row
const itemRowElements = {} // item name -> elements in its row
const headerRowElements = {} // job or skill category name -> elements in its header
const requiredRowElements = {} // category name -> its "Required:" row and parts
let sidebarElements = null
let quickTaskElements = null

function findSidebarElements() {
    const ids = ["ageDisplay", "dayDisplay", "lifespanDisplay", "pauseButton", "coinDisplay", "signDisplay",
        "netDisplay", "incomeDisplay", "expenseDisplay", "happinessDisplay", "evilDisplay", "evilGainDisplay",
        "timeWarpingDisplay", "timeWarpingButton", "deathText"]
    const elements = {}
    for (const id of ids) elements[id] = document.getElementById(id)
    return elements
}

function findQuickTaskElements() {
    const quickTaskDisplayElement = document.getElementById("quickTaskDisplay")
    const elements = {}
    for (const taskType of ["job", "skill"]) {
        const progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0]
        elements[taskType] = {
            name: progressBar.getElementsByClassName("name")[0],
            progressFill: progressBar.getElementsByClassName("progressFill")[0],
        }
    }
    return elements
}

// Rendering runs about 10 times a second, but most values change far less
// often, so the page is only written to when a value has changed. Each
// element remembers what was last written to it.
const shownValues = new WeakMap()

function hasChanged(element, key, value) {
    let shown = shownValues.get(element)
    if (shown === undefined) {
        shown = {}
        shownValues.set(element, shown)
    }
    if (key in shown && shown[key] === value) return false
    shown[key] = value
    return true
}

function setText(element, text) {
    text = String(text)
    if (hasChanged(element, "text", text)) element.textContent = text
}

function setStyle(element, property, value) {
    if (hasChanged(element, "style " + property, value)) element.style[property] = value
}

function setClass(element, className, on) {
    if (hasChanged(element, "class " + className, on)) element.classList.toggle(className, on)
}

function setDisabled(element, disabled) {
    if (hasChanged(element, "disabled", disabled)) element.disabled = disabled
}

function createRequiredRow(categoryName) {
    const requiredRow = document.getElementsByClassName("requiredRowTemplate")[0].content.firstElementChild.cloneNode(true)
    requiredRow.classList.add("requiredRow")
    requiredRow.classList.add(removeSpaces(categoryName))
    requiredRow.id = categoryName
    requiredRowElements[categoryName] = {
        row: requiredRow,
        coins: requiredRow.getElementsByClassName("coins")[0],
        levels: requiredRow.getElementsByClassName("levels")[0],
        evil: requiredRow.getElementsByClassName("evil")[0],
    }
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
    if (categoryType != itemCategories) {
        headerRowElements[categoryName] = {
            maxLevel: headerRow.getElementsByClassName("maxLevel")[0],
            skipSkill: headerRow.getElementsByClassName("skipSkill")[0],
        }
    }
    
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

    if (categoryType != itemCategories) {
        const valueElement = row.getElementsByClassName("value")[0]
        taskRowElements[name] = {
            level: row.getElementsByClassName("level")[0],
            xpGain: row.getElementsByClassName("xpGain")[0],
            xpLeft: row.getElementsByClassName("xpLeft")[0],
            maxLevel: row.getElementsByClassName("maxLevel")[0],
            progressFill: row.getElementsByClassName("progressFill")[0],
            income: valueElement.getElementsByClassName("income")[0],
            effect: valueElement.getElementsByClassName("effect")[0],
            skipSkill: row.getElementsByClassName("skipSkill")[0],
            skipCheckbox: categoryType == skillCategories ? row.getElementsByClassName("checkbox")[0] : null,
        }
    } else {
        itemRowElements[name] = {
            button: row.getElementsByClassName("button")[0],
            active: row.getElementsByClassName("active")[0],
            effect: row.getElementsByClassName("effect")[0],
            expense: row.getElementsByClassName("expense")[0],
        }
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
    const elements = quickTaskElements[taskType]
    setText(elements.name, currentTask.name + " lvl " + currentTask.level)
    setStyle(elements.progressFill, "width", currentTask.xp / currentTask.getMaxXp() * 100 + "%")
}

function updateRequiredRows(data, categoryType) {
    for (const categoryName in categoryType) {
        const requiredRow = requiredRowElements[categoryName].row
        let nextEntity = null
        const category = categoryType[categoryName]
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

        setClass(requiredRow, "hiddenTask", nextEntity == null)
        if (nextEntity == null) continue

        const requirementObject = gameData.requirements[nextEntity.name]
        const requirements = requirementObject.requirements

        const coinElement = requiredRowElements[categoryName].coins
        const levelElement = requiredRowElements[categoryName].levels
        const evilElement = requiredRowElements[categoryName].evil

        const showEvil = data == gameData.taskData && requirementObject instanceof EvilRequirement
        const showLevels = data == gameData.taskData && !showEvil
        const showCoins = data == gameData.itemData
        setClass(coinElement, "hiddenTask", !showCoins)
        setClass(levelElement, "hiddenTask", !showLevels)
        setClass(evilElement, "hiddenTask", !showEvil)

        if (showEvil) {
            setText(evilElement, format(requirements[0].requirement) + " evil")
        } else if (showLevels) {
            let finalText = ""
            for (const requirement of requirements) {
                const task = gameData.taskData[requirement.task]
                if (task.level >= requirement.requirement) continue
                const text = " " + requirement.task + " level " + format(task.level) + "/" + format(requirement.requirement) + ","
                finalText += text
            }
            finalText = finalText.substring(0, finalText.length - 1)
            setText(levelElement, finalText)
        } else if (showCoins) {
            formatCoins(requirements[0].requirement, coinElement)
        }
    }
}

function updateTaskRows() {
    for (const key in gameData.taskData) {
        const task = gameData.taskData[key]
        const row = taskRowElements[task.name]
        setText(row.level, task.level)
        setText(row.xpGain, format(task.getXpGain()))
        setText(row.xpLeft, format(task.getXpLeft()))

        setText(row.maxLevel, task.maxLevel)
        setClass(row.maxLevel, "hidden", !(gameData.rebirthOneCount > 0))

        setStyle(row.progressFill, "width", task.xp / task.getMaxXp() * 100 + "%")
        setClass(row.progressFill, "current", task == gameData.currentJob || task == gameData.currentSkill)

        setStyle(row.skipSkill, "display", task instanceof Skill && gameData.automation.autoLearn ? "block" : "none")

        if (task instanceof Job) {
            formatCoins(task.getIncome(), row.income)
        } else {
            setText(row.effect, task.getEffectDescription())
        }
    }
}

function updateItemRows() {
    for (const key in gameData.itemData) {
        const item = gameData.itemData[key]
        const row = itemRowElements[item.name]
        setDisabled(row.button, gameData.coins < item.getExpense())
        const color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"]
        setStyle(row.active, "backgroundColor", gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white")
        setText(row.effect, item.getEffectDescription())
        formatCoins(item.getExpense(), row.expense)
    }
}

function updateHeaderRows(categories) {
    for (const categoryName in categories) {
        const headerRow = headerRowElements[categoryName]
        setClass(headerRow.maxLevel, "hidden", !(gameData.rebirthOneCount > 0))
        setStyle(headerRow.skipSkill, "display", categories == skillCategories && gameData.automation.autoLearn ? "block" : "none")
    }
}

function updateText() {
    //Sidebar
    const sidebar = sidebarElements
    setText(sidebar.ageDisplay, daysToYears(gameData.days))
    setText(sidebar.dayDisplay, getDay())
    setText(sidebar.lifespanDisplay, daysToYears(getLifespan()))
    setText(sidebar.pauseButton, gameData.paused ? "Play" : "Pause")

    formatCoins(gameData.coins, sidebar.coinDisplay)
    setSignDisplay()
    formatCoins(getNet(), sidebar.netDisplay)
    formatCoins(getIncome(), sidebar.incomeDisplay)
    formatCoins(getExpense(), sidebar.expenseDisplay)

    setText(sidebar.happinessDisplay, getHappiness().toFixed(1))

    setText(sidebar.evilDisplay, gameData.evil.toFixed(1))
    setText(sidebar.evilGainDisplay, getEvilGain().toFixed(1))

    setText(sidebar.timeWarpingDisplay, "x" + getTaskById("time_warping").getEffect().toFixed(2))
    setText(sidebar.timeWarpingButton, gameData.timeWarpingEnabled ? "Disable warp" : "Enable warp")

    setClass(sidebar.deathText, "hidden", !isLifeOver())
}

function setSignDisplay() {
    const signDisplay = sidebarElements.signDisplay
    if (getIncome() > getExpense()) {
        setText(signDisplay, "+")
        setStyle(signDisplay, "color", "green")
    } else if (getExpense() > getIncome()) {
        setText(signDisplay, "-")
        setStyle(signDisplay, "color", "red")
    } else {
        setText(signDisplay, "")
        setStyle(signDisplay, "color", "gray")
    }
}

function hideEntities() {
    for (const key in requirementElements) {
        const completed = gameData.requirements[key].completed
        for (const element of requirementElements[key]) {
            setClass(element, "hidden", !completed)
        }
    }
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
        setText(element.children[i], x > 0 ? text : "")
        setStyle(element.children[i], "color", colors[tier])
        i += 1
    }
    if (leftOver == 0 && coins > 0) {setText(element.children[3], ""); return}
    const copperText = String(Math.floor(leftOver)) + "c"
    setText(element.children[3], copperText)
    setStyle(element.children[3], "color", colors["c"])
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
    return document.getElementById("row " + taskName)
}

function getItemElement(itemName) {
    return document.getElementById("row " + itemName)
}

function getElementsByClass(className) {
    const elements = document.getElementsByClassName(removeSpaces(className))
    return elements
}

// The settings themselves are saved with the game; the checkboxes only
// change them (and are kept in step by updateAutomationControls)
function setUpAutomationControls() {
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

// Builds the page
function initUI() {
    createAllRows(jobCategories, "jobTable")
    createAllRows(skillCategories, "skillTable")
    createAllRows(itemCategories, "itemTable")
    sidebarElements = findSidebarElements()
    quickTaskElements = findQuickTaskElements()
    setUpAutomationControls()
    requirementElements = createRequirementElements()
    setTab(jobTabButton, "jobs")
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
    updateAutomationControls()
}

// Keeps the automation checkboxes showing the game state, e.g. after a save
// is loaded. Compares with the checkbox itself because the player can tick it.
function updateAutomationControls() {
    setChecked(autoPromoteElement, gameData.automation.autoPromote)
    setChecked(autoLearnElement, gameData.automation.autoLearn)
    for (const name in taskRowElements) {
        const checkbox = taskRowElements[name].skipCheckbox
        if (checkbox) setChecked(checkbox, gameData.automation.skippedSkills.has(idsByName[name]))
    }
}

function setChecked(checkbox, checked) {
    if (checkbox.checked !== checked) checkbox.checked = checked
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

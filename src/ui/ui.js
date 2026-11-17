// The page: building the rows, showing the game state, and the handlers
// that turn clicks into changes to that state. Rendering only reads the
// game state; it never changes it.

import { jobs, skills, items, unlocks, idsByName, jobCategories, skillCategories, itemCategories, headerRowColors, tooltips } from "../game/data.ts"
import { gameData } from "../game/state.ts"
import { daysToYears, getLifespan } from "../game/rules.ts"
import { Job, Skill, EvilRequirement } from "../game/classes.ts"
import { getTaskById, getHappiness, getEvilGain, getExpense, setPause, setTimeWarping, setAutoPromote, setAutoLearn, setSkillSkipped, setTask, setProperty, setMisc, getNet, getIncome, getDay, rebirthOne, rebirthTwo, isLifeOver } from "../game/engine.ts"
import { clearSave, importSave, exportSave } from "../game/save.ts"
import { format, formatCoins } from "./format.ts"

export const autoPromoteElement = document.getElementById("autoPromote")
export const autoLearnElement = document.getElementById("autoLearn")

export const jobTabButton = document.getElementById("jobTabButton")

export function setTab(element, selectedTab) {

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
export let shownRebirthCount = null

export function updateTabAfterRebirth() {
    const rebirthCount = gameData.rebirthOneCount + gameData.rebirthTwoCount
    if (shownRebirthCount !== null && rebirthCount != shownRebirthCount) {
        setTab(jobTabButton, "jobs")
    }
    shownRebirthCount = rebirthCount
}

// Elements that rendering writes to, looked up once when the page is built
export const taskRowElements = {} // task name -> elements in its row
export const itemRowElements = {} // item name -> elements in its row
export const headerRowElements = {} // job or skill category name -> elements in its header
export const requiredRowElements = {} // category name -> its "Required:" row and parts
export let sidebarElements = null
export let quickTaskElements = null

export function findSidebarElements() {
    const ids = ["ageDisplay", "dayDisplay", "lifespanDisplay", "pauseButton", "coinDisplay", "signDisplay",
        "netDisplay", "incomeDisplay", "expenseDisplay", "happinessDisplay", "evilDisplay", "evilGainDisplay",
        "timeWarpingDisplay", "timeWarpingButton", "deathText"]
    const elements = {}
    for (const id of ids) elements[id] = document.getElementById(id)
    return elements
}

export function findQuickTaskElements() {
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
export const shownValues = new WeakMap()

export function hasChanged(element, key, value) {
    let shown = shownValues.get(element)
    if (shown === undefined) {
        shown = {}
        shownValues.set(element, shown)
    }
    if (key in shown && shown[key] === value) return false
    shown[key] = value
    return true
}

export function setText(element, text) {
    text = String(text)
    if (hasChanged(element, "text", text)) element.textContent = text
}

export function setStyle(element, property, value) {
    if (hasChanged(element, "style " + property, value)) element.style[property] = value
}

export function setClass(element, className, on) {
    if (hasChanged(element, "class " + className, on)) element.classList.toggle(className, on)
}

export function setDisabled(element, disabled) {
    if (hasChanged(element, "disabled", disabled)) element.disabled = disabled
}

export function createRequiredRow(categoryName) {
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

export function createHeaderRow(templates, categoryType, categoryName) {
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

export function createRow(templates, name, categoryName, categoryType) {
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

export function createAllRows(categoryType, tableId) {
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

export function updateQuickTaskDisplay(taskType) {
    const currentTask = taskType == "job" ? gameData.currentJob : gameData.currentSkill
    const elements = quickTaskElements[taskType]
    setText(elements.name, currentTask.name + " lvl " + currentTask.level)
    setStyle(elements.progressFill, "width", currentTask.xp / currentTask.getMaxXp() * 100 + "%")
}

export function updateRequiredRows(data, categoryType) {
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
            writeCoins(requirements[0].requirement, coinElement)
        }
    }
}

export function updateTaskRows() {
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
            writeCoins(task.getIncome(), row.income)
        } else {
            setText(row.effect, task.getEffectDescription())
        }
    }
}

export function updateItemRows() {
    for (const key in gameData.itemData) {
        const item = gameData.itemData[key]
        const row = itemRowElements[item.name]
        setDisabled(row.button, gameData.coins < item.getExpense())
        const color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"]
        setStyle(row.active, "backgroundColor", gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white")
        setText(row.effect, item.getEffectDescription())
        writeCoins(item.getExpense(), row.expense)
    }
}

export function updateHeaderRows(categories) {
    for (const categoryName in categories) {
        const headerRow = headerRowElements[categoryName]
        setClass(headerRow.maxLevel, "hidden", !(gameData.rebirthOneCount > 0))
        setStyle(headerRow.skipSkill, "display", categories == skillCategories && gameData.automation.autoLearn ? "block" : "none")
    }
}

export function updateText() {
    //Sidebar
    const sidebar = sidebarElements
    setText(sidebar.ageDisplay, daysToYears(gameData.days))
    setText(sidebar.dayDisplay, getDay())
    setText(sidebar.lifespanDisplay, daysToYears(getLifespan()))
    setText(sidebar.pauseButton, gameData.paused ? "Play" : "Pause")

    writeCoins(gameData.coins, sidebar.coinDisplay)
    setSignDisplay()
    writeCoins(getNet(), sidebar.netDisplay)
    writeCoins(getIncome(), sidebar.incomeDisplay)
    writeCoins(getExpense(), sidebar.expenseDisplay)

    setText(sidebar.happinessDisplay, getHappiness().toFixed(1))

    setText(sidebar.evilDisplay, gameData.evil.toFixed(1))
    setText(sidebar.evilGainDisplay, getEvilGain().toFixed(1))

    setText(sidebar.timeWarpingDisplay, "x" + getTaskById("time_warping").getEffect().toFixed(2))
    setText(sidebar.timeWarpingButton, gameData.timeWarpingEnabled ? "Disable warp" : "Enable warp")

    setClass(sidebar.deathText, "hidden", !isLifeOver())
}

export function setSignDisplay() {
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

export function hideEntities() {
    for (const key in requirementElements) {
        const completed = gameData.requirements[key].completed
        for (const element of requirementElements[key]) {
            setClass(element, "hidden", !completed)
        }
    }
}

// Writes an amount of coins into an element with four parts (platinum,
// gold, silver, copper)
export function writeCoins(coins, element) {
    formatCoins(coins).forEach(function(part, i) {
        setText(element.children[i], part.text)
        if (part.color) setStyle(element.children[i], "color", part.color)
    })
}

// Requirement key -> the page elements shown once it is completed
export let requirementElements = {}

export function createRequirementElements() {
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

export function getTaskElement(taskName) {
    return document.getElementById("row " + taskName)
}

export function getItemElement(itemName) {
    return document.getElementById("row " + itemName)
}

export function getElementsByClass(className) {
    const elements = document.getElementsByClassName(removeSpaces(className))
    return elements
}

// Wires the page's buttons to the functions they run
export function setUpButtons() {
    for (const tabButton of document.getElementsByClassName("tabButton")) {
        tabButton.onclick = function() {setTab(tabButton, tabButton.dataset.tab)}
    }
    const buttonActions = {
        pauseButton: function() {setPause()},
        timeWarpingButton: function() {setTimeWarping()},
        rebirthOneButton: function() {rebirthOne()},
        rebirthTwoButton: function() {rebirthTwo()},
        importButton: function() {importGameData()},
        exportButton: function() {exportGameData()},
        lightDarkButton: function() {setLightDarkMode()},
        resetButton: function() {resetGameData()},
    }
    for (const id in buttonActions) {
        document.getElementById(id).onclick = buttonActions[id]
    }
    // Pressing Enter in the import box mustn't submit (and reload) the page
    document.getElementById("importExportForm").onsubmit = function() {return false}
}

// The settings themselves are saved with the game; the checkboxes only
// change them (and are kept in step by updateAutomationControls)
export function setUpAutomationControls() {
    autoPromoteElement.onchange = function() {setAutoPromote(autoPromoteElement.checked)}
    autoLearnElement.onchange = function() {setAutoLearn(autoLearnElement.checked)}
}

export function setLightDarkMode() {
    const body = document.getElementById("body")
    body.classList.contains("dark") ? body.classList.remove("dark") : body.classList.add("dark")
}

export function resetGameData() {
    clearSave()
    location.reload()
}

export function importGameData() {
    const importExportBox = document.getElementById("importExportBox")
    const error = importSave(importExportBox.value)
    if (error) {
        showImportError(error)
        return
    }
    location.reload()
}

export function showImportError(message) {
    const importError = document.getElementById("importError")
    importError.textContent = message
    importError.classList.remove("hidden")
}

export function hideImportError() {
    document.getElementById("importError").classList.add("hidden")
}

export function exportGameData() {
    hideImportError()
    document.getElementById("importExportBox").value = exportSave()
}

export function removeSpaces(string) {
    return string.replace(/ /g, "")
}

// Builds the page
export function initUI() {
    createAllRows(jobCategories, "jobTable")
    createAllRows(skillCategories, "skillTable")
    createAllRows(itemCategories, "itemTable")
    sidebarElements = findSidebarElements()
    quickTaskElements = findQuickTaskElements()
    setUpButtons()
    setUpAutomationControls()
    requirementElements = createRequirementElements()
    setTab(jobTabButton, "jobs")
}

export function updateUI() {
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
export function updateAutomationControls() {
    setChecked(autoPromoteElement, gameData.automation.autoPromote)
    setChecked(autoLearnElement, gameData.automation.autoLearn)
    for (const name in taskRowElements) {
        const checkbox = taskRowElements[name].skipCheckbox
        if (checkbox) setChecked(checkbox, gameData.automation.skippedSkills.has(idsByName[name]))
    }
}

export function setChecked(checkbox, checked) {
    if (checkbox.checked !== checked) checkbox.checked = checked
}

// About 10 frames per second is plenty for numbers and progress bars
export const renderInterval = 100
export let lastRenderTime = -Infinity

export function renderFrame(now) {
    if (now - lastRenderTime >= renderInterval) {
        lastRenderTime = now
        updateUI()
    }
    requestAnimationFrame(renderFrame)
}

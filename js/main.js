"use strict"

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

// Builds the page
function initUI() {
    createAllRows(jobCategories, "jobTable")
    createAllRows(skillCategories, "skillTable")
    createAllRows(itemCategories, "itemTable") 
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

initUI()
initGameData()
loadGameData()

update()
updateUI()
setInterval(update, 1000 / updateSpeed)
requestAnimationFrame(renderFrame)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)
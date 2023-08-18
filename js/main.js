'use strict';

// Not a const as it can be overridden when loading a save game
let gameData = {
    taskData: {},
    itemData: {},

    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,
    autoLearnEnabled: false,
    autoPromoteEnabled: false,

    rebirthOneCount: 0,
    rebirthTwoCount: 0,

    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: null,
};

const tempData = {};

let skillWithLowestMaxXp = null;

const autoPromoteElement = document.getElementById('autoPromote');
const autoLearnElement = document.getElementById('autoLearn');

const jobTabButton = document.getElementById('jobTabButton');

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

function getBoundTaskEffect(taskName) {
    const task = gameData.taskData[taskName];
    return task.getEffect.bind(task);
}

function getBoundItemEffect(itemName) {
    const item = gameData.itemData[itemName];
    return item.getEffect.bind(item);
}

function getEvil() {
    return gameData.evil;
}

function applyMultipliers(value, multipliers) {
    let finalMultiplier = 1;
    multipliers.forEach(function (multiplierFunction) {
        const multiplier = multiplierFunction();
        finalMultiplier *= multiplier;
    });
    return Math.round(value * finalMultiplier);
}

function applySpeed(value) {
    return value * getGameSpeed() / updateSpeed;
}

function getEvilGain() {
    const evilControl = gameData.taskData['Evil control'];
    const bloodMeditation = gameData.taskData['Blood meditation'];
    return evilControl.getEffect() * bloodMeditation.getEffect();
}

function getGameSpeed() {
    const timeWarping = gameData.taskData['Time warping'];
    const timeWarpingSpeed = gameData.timeWarpingEnabled ? timeWarping.getEffect() : 1;
    return baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed;
}

function applyExpenses() {
    const coins = applySpeed(getExpense());
    gameData.coins -= coins;
    if (gameData.coins < 0) {
        goBankrupt();
    }
}

function getExpense() {
    let expense = 0;
    expense += gameData.currentProperty.getExpense();
    for (let misc of gameData.currentMisc) {
        expense += misc.getExpense();
    }
    return expense;
}

function goBankrupt() {
    gameData.coins = 0;
    gameData.currentProperty = gameData.itemData['Homeless'];
    gameData.currentMisc = [];
}

function setTab(element, selectedTab) {
    const tabs = Array.prototype.slice.call(document.getElementsByClassName('tab'));
    tabs.forEach(function (tab) {
        tab.style.display = 'none';
    });
    document.getElementById(selectedTab).style.display = 'block';

    const tabButtons = document.getElementsByClassName('tabButton');
    for (let tabButton of tabButtons) {
        tabButton.classList.remove('w3-blue-gray');
    }
    element.classList.add('w3-blue-gray');
}

// noinspection JSUnusedGlobalSymbols used in HTML
function setPause() {
    gameData.paused = !gameData.paused;
}

// noinspection JSUnusedGlobalSymbols used in HTML
function setTimeWarping() {
    gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled;
}

function setTask(taskName) {
    const task = gameData.taskData[taskName];
    if (task instanceof Job) {
        gameData.currentJob = task;
    } else {
        gameData.currentSkill = task;
    }
}

function setProperty(propertyName) {
    gameData.currentProperty = gameData.itemData[propertyName];
}

function setMisc(miscName) {
    const misc = gameData.itemData[miscName];
    if (gameData.currentMisc.includes(misc)) {
        for (let i = 0; i < gameData.currentMisc.length; i++) {
            if (gameData.currentMisc[i] === misc) {
                gameData.currentMisc.splice(i, 1);
            }
        }
    } else {
        gameData.currentMisc.push(misc);
    }
}

function createData(data, baseData) {
    for (let key in baseData) {
        const entity = baseData[key];
        createEntity(data, entity);
    }
}

function createEntity(data, entity) {
    if ('income' in entity) {
        data[entity.name] = new Job(entity);
    } else if ('maxXp' in entity) {
        data[entity.name] = new Skill(entity);
    } else {
        data[entity.name] = new Item(entity);
    }
    // TODO get rid of whitespace ids
    data[entity.name].id = 'row ' + entity.name;
}

function createRequiredRow(categoryName) {
    const requiredRow = document.getElementsByClassName('requiredRowTemplate')[0].content.firstElementChild.cloneNode(true);
    requiredRow.classList.add('requiredRow');
    requiredRow.classList.add(removeSpaces(categoryName));
    requiredRow.id = categoryName;
    return requiredRow;
}

function createHeaderRow(templates, categoryType, categoryName) {
    const headerRow = templates.headerRow.content.firstElementChild.cloneNode(true);
    headerRow.getElementsByClassName('category')[0].textContent = categoryName;
    if (categoryType !== itemCategories) {
        headerRow.getElementsByClassName('valueType')[0].textContent = categoryType === jobCategories ? 'Generated/cycle' : 'Effect';
    }

    headerRow.style.backgroundColor = headerRowColors[categoryName];
    headerRow.style.color = '#FFFFFF';
    headerRow.classList.add(removeSpaces(categoryName));
    headerRow.classList.add('headerRow');

    return headerRow;
}

function createRow(templates, name, categoryName, categoryType) {
    const row = templates.row.content.firstElementChild.cloneNode(true);
    row.getElementsByClassName('name')[0].textContent = name;
    row.getElementsByClassName('tooltipText')[0].textContent = tooltips[name];
    row.id = 'row ' + name;
    if (categoryType !== itemCategories) {
        row.getElementsByClassName('progressBar')[0].onclick = function () {
            setTask(name);
        };
    } else {
        if (categoryName === 'Properties') {
            row.getElementsByClassName('button')[0].onclick = function () {
                setProperty(name);
            };
            row.getElementsByClassName('radio')[0].onclick = function () {
                setProperty(name);
            };
        } else {
            row.getElementsByClassName('button')[0].onclick = function () {
                setMisc(name);
            };
            row.getElementsByClassName('radio')[0].onclick = function () {
                setMisc(name);
            };
        }
    }

    return row;
}

function createAllRows(categoryType, tableId) {
    const templates = {
        headerRow: document.getElementsByClassName(categoryType === itemCategories ? 'headerRowItemTemplate' : 'headerRowTaskTemplate')[0],
        row: document.getElementsByClassName(categoryType === itemCategories ? 'rowItemTemplate' : 'rowTaskTemplate')[0],
    };

    const table = document.getElementById(tableId);

    for (let categoryName in categoryType) {
        const headerRow = createHeaderRow(templates, categoryType, categoryName);
        table.appendChild(headerRow);

        const category = categoryType[categoryName];
        category.forEach(function (name) {
            const row = createRow(templates, name, categoryName, categoryType);
            table.appendChild(row);
        });

        const requiredRow = createRequiredRow(categoryName);
        table.append(requiredRow);
    }
}

function updateQuickTaskDisplay(taskType) {
    const currentTask = taskType === 'job' ? gameData.currentJob : gameData.currentSkill;
    const quickTaskDisplayElement = document.getElementById('quickTaskDisplay');
    const progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0];
    progressBar.getElementsByClassName('name')[0].textContent = currentTask.name + ' lvl ' + currentTask.level;
    progressBar.getElementsByClassName('progressFill')[0].style.width = currentTask.xp / currentTask.getMaxXp() * 100 + '%';
}

function updateRequiredRows(data, categoryType) {
    const requiredRows = document.getElementsByClassName('requiredRow');
    for (let requiredRow of requiredRows) {
        let nextEntity = null;
        const category = categoryType[requiredRow.id];
        if (category == null) {
            continue;
        }
        for (let i = 0; i < category.length; i++) {
            const entityName = category[i];
            if (i >= category.length - 1) break;
            let requirements = gameData.requirements[entityName];
            if (requirements && i === 0) {
                if (!requirements.isCompleted()) {
                    nextEntity = data[entityName];
                    break;
                }
            }

            const nextIndex = i + 1;
            if (nextIndex >= category.length) {
                break;
            }
            const nextEntityName = category[nextIndex];
            let nextEntityRequirements = gameData.requirements[nextEntityName];

            if (!nextEntityRequirements.isCompleted()) {
                nextEntity = data[nextEntityName];
                break;
            }
        }

        if (nextEntity == null) {
            requiredRow.classList.add('hiddenTask');
        } else {
            requiredRow.classList.remove('hiddenTask');
            const requirementObject = gameData.requirements[nextEntity.name];
            let requirements = requirementObject.requirements;

            const coinElement = requiredRow.getElementsByClassName('coins')[0];
            const levelElement = requiredRow.getElementsByClassName('levels')[0];
            const evilElement = requiredRow.getElementsByClassName('evil')[0];

            coinElement.classList.add('hiddenTask');
            levelElement.classList.add('hiddenTask');
            evilElement.classList.add('hiddenTask');

            let finalText = [];
            if (data === gameData.taskData) {
                if (requirementObject instanceof EvilRequirement) {
                    evilElement.classList.remove('hiddenTask');
                    evilElement.textContent = format(requirements[0].requirement) + ' evil';
                } else {
                    levelElement.classList.remove('hiddenTask');
                    for (let requirement of requirements) {
                        const task = gameData.taskData[requirement.task];
                        if (task.level >= requirement.requirement) continue;
                        const text = requirement.task + ' level ' + format(task.level) + '/' + format(requirement.requirement);
                        finalText.push(text);
                    }
                    levelElement.textContent = finalText.join(', ');
                }
            } else if (data === gameData.itemData) {
                coinElement.classList.remove('hiddenTask');
                formatCoins(requirements[0].requirement, coinElement);
            }
        }
    }
}

function updateTaskRows() {
    for (let key in gameData.taskData) {
        const task = gameData.taskData[key];
        const row = document.getElementById('row ' + task.name);
        row.getElementsByClassName('level')[0].textContent = task.level;
        row.getElementsByClassName('xpGain')[0].textContent = format(task.getXpGain());
        row.getElementsByClassName('xpLeft')[0].textContent = format(task.getXpLeft());

        const maxLevel = row.getElementsByClassName('maxLevel')[0];
        maxLevel.textContent = task.maxLevel;
        gameData.rebirthOneCount > 0 ? maxLevel.classList.remove('hidden') : maxLevel.classList.add('hidden');

        const progressFill = row.getElementsByClassName('progressFill')[0];
        progressFill.style.width = task.xp / task.getMaxXp() * 100 + '%';
        if (task === gameData.currentJob || task === gameData.currentSkill) {
            progressFill.classList.add('current');
        } else {
            progressFill.classList.remove('current');
        }

        const valueElement = row.getElementsByClassName('value')[0];
        valueElement.getElementsByClassName('income')[0].style.display = task instanceof Job ? 'block' : 'none';
        valueElement.getElementsByClassName('effect')[0].style.display = task instanceof Skill ? 'block' : 'none';

        const skipSkillElement = row.getElementsByClassName('skipSkill')[0];
        skipSkillElement.style.display = task instanceof Skill && autoLearnElement.checked ? 'block' : 'none';

        if (task instanceof Job) {
            formatCoins(task.getIncome(), valueElement.getElementsByClassName('income')[0]);
        } else {
            valueElement.getElementsByClassName('effect')[0].textContent = task.getEffectDescription();
        }
    }
}

function updateItemRows() {
    for (let key in gameData.itemData) {
        const item = gameData.itemData[key];
        const row = document.getElementById('row ' + item.name);
        const button = row.getElementsByClassName('button')[0];
        button.disabled = gameData.coins < item.getExpense();
        const active = row.getElementsByClassName('active')[0];
        const color = itemCategories['Properties'].includes(item.name) ? headerRowColors['Properties'] : headerRowColors['Misc'];
        active.style.backgroundColor = gameData.currentMisc.includes(item) || item === gameData.currentProperty ? color : 'white';
        row.getElementsByClassName('effect')[0].textContent = item.getEffectDescription();
        formatCoins(item.getExpense(), row.getElementsByClassName('expense')[0]);
    }
}

function updateHeaderRows(categories) {
    for (let categoryName in categories) {
        const className = removeSpaces(categoryName);
        const headerRow = document.getElementsByClassName(className)[0];
        const maxLevelElement = headerRow.getElementsByClassName('maxLevel')[0];
        gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove('hidden') : maxLevelElement.classList.add('hidden');
        const skipSkillElement = headerRow.getElementsByClassName('skipSkill')[0];
        skipSkillElement.style.display = categories === skillCategories && autoLearnElement.checked ? 'block' : 'none';
    }
}

function updateText() {
    //Sidebar
    document.getElementById('ageDisplay').textContent = String(daysToYears(gameData.days));
    document.getElementById('dayDisplay').textContent = String(getDay());
    document.getElementById('lifespanDisplay').textContent = String(daysToYears(getLifespan()));
    document.getElementById('pauseButton').textContent = gameData.paused ? 'Play' : 'Pause';

    formatCoins(gameData.coins, document.getElementById('coinDisplay'));
    setSignDisplay();
    formatCoins(getNet(), document.getElementById('netDisplay'));
    formatCoins(getIncome(), document.getElementById('incomeDisplay'));
    formatCoins(getExpense(), document.getElementById('expenseDisplay'));

    document.getElementById('happinessDisplay').textContent = formatPopulation(getPopulation());

    document.getElementById('evilDisplay').textContent = gameData.evil.toFixed(1);
    document.getElementById('evilGainDisplay').textContent = getEvilGain().toFixed(1);

    document.getElementById('timeWarpingDisplay').textContent = 'x' + gameData.taskData['Time warping'].getEffect().toFixed(2);
    document.getElementById('timeWarpingButton').textContent = gameData.timeWarpingEnabled ? 'Disable warp' : 'Enable warp';
}

function setSignDisplay() {
    const signDisplay = document.getElementById('signDisplay');
    if (getIncome() > getExpense()) {
        signDisplay.textContent = '+';
        signDisplay.style.color = 'green';
    } else if (getExpense() > getIncome()) {
        signDisplay.textContent = '-';
        signDisplay.style.color = 'red';
    } else {
        signDisplay.textContent = '';
        signDisplay.style.color = 'gray';
    }
}

function getNet() {
    return Math.abs(getIncome() - getExpense());
}

function hideEntities() {
    for (let key in gameData.requirements) {
        const requirement = gameData.requirements[key];
        const completed = requirement.isCompleted();
        for (let element of requirement.elements) {
            if (completed) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    }
}

function updateBodyClasses() {
    const displayAsPaused = gameData.paused || !isAlive();
    document.getElementById('body').classList.toggle('game-paused', displayAsPaused);
    document.getElementById('body').classList.toggle('game-playing', !displayAsPaused);
}

function doTask(task) {
    task.increaseXp();
    if (task instanceof Job) {
        increaseCoins();
    }
}

function getIncome() {
    let income = 0;
    income += gameData.currentJob.getIncome();
    return income;
}

function increaseCoins() {
    const coins = applySpeed(getIncome());
    gameData.coins += coins;
}

function daysToYears(days) {
    return Math.floor(days / 365);
}

function getCategoryFromEntityName(categoryType, entityName) {
    for (let categoryName in categoryType) {
        const category = categoryType[categoryName];
        if (category.includes(entityName)) {
            return category;
        }
    }
}

function getNextEntity(data, categoryType, entityName) {
    const category = getCategoryFromEntityName(categoryType, entityName);
    const nextIndex = category.indexOf(entityName) + 1;
    if (nextIndex > category.length - 1) return null;
    const nextEntityName = category[nextIndex];
    return data[nextEntityName];
}

function autoPromote() {
    gameData.autoPromoteEnabled = autoPromoteElement.checked;
    if (!autoPromoteElement.checked) return;
    const nextEntity = getNextEntity(gameData.taskData, jobCategories, gameData.currentJob.name);
    if (nextEntity == null) return;
    const requirement = gameData.requirements[nextEntity.name];
    if (requirement.isCompleted()) gameData.currentJob = nextEntity;
}

function checkSkillSkipped(skill) {
    const row = document.getElementById('row ' + skill.name);
    return row.getElementsByClassName('checkbox')[0].checked;
}

function setSkillWithLowestMaxXp() {
    const xpDict = {};

    for (let skillName in gameData.taskData) {
        const skill = gameData.taskData[skillName];
        const requirement = gameData.requirements[skillName];
        if (skill instanceof Skill && requirement.isCompleted() && !checkSkillSkipped(skill)) {
            xpDict[skill.name] = skill.level; //skill.getMaxXp() / skill.getXpGain()
        }
    }

    if (Object.values(xpDict).length === 0) {
        skillWithLowestMaxXp = gameData.taskData['Concentration'];
        return;
    }

    const skillName = getKeyOfLowestValueFromDict(xpDict);
    skillWithLowestMaxXp = gameData.taskData[skillName];
}

function getKeyOfLowestValueFromDict(dict) {
    const values = Object.values(dict);

    values.sort(function (a, b) {
        return a - b;
    });

    for (let key in dict) {
        if (dict[key] === values[0]) {
            return key;
        }
    }
}

function autoLearn() {
    gameData.autoLearnEnabled = autoLearnElement.checked;
    if (!autoLearnElement.checked || !skillWithLowestMaxXp) return;
    gameData.currentSkill = skillWithLowestMaxXp;
}

function yearsToDays(years) {
    return years * 365;
}

function getDay() {
    return Math.floor(gameData.days - daysToYears(gameData.days) * 365);
}

function increaseDays() {
    const increase = applySpeed(1);
    gameData.days += increase;
}

function format(number) {

    // what tier? (determines SI symbol)
    const tier = Math.log10(number) / 3 | 0;

    // if zero, we don't need a suffix
    if (tier === 0) return number;

    // get suffix and determine scale
    const suffix = units[tier];
    const scale = Math.pow(10, tier * 3);

    // scale the number
    const scaled = number / scale;

    // format number and add suffix
    return scaled.toFixed(1) + suffix;
}

function formatCoins(coins, element) {
    let leftOver = coins;
    let i = 0;
    for (let tier of coinTiers) {
        let x = Math.floor(leftOver / Math.pow(10, (coinTiers.length - i) * 2));
        leftOver = Math.floor(leftOver - x * Math.pow(10, (coinTiers.length - i) * 2));
        let text = format(String(x)) + tier + ' ';
        element.children[i].textContent = x > 0 ? text : '';
        element.children[i].style.color = coinColors[tier];
        i += 1;
    }
    if (leftOver === 0 && coins > 0) {
        element.children[3].textContent = '';
        return;
    }
    element.children[3].textContent = String(Math.floor(leftOver)) + 'c';
    element.children[3].style.color = coinColors['c'];
}

function formatPopulation(population) {
    // Create some reasonable display numbers
    if (population > 1.4 && population <= 10.4) return (population * 2).toFixed(0);

    return population.toFixed(0);
}

function getTaskElement(taskName) {
    const task = gameData.taskData[taskName];
    return document.getElementById(task.id);
}

function getItemElement(itemName) {
    const item = gameData.itemData[itemName];
    return document.getElementById(item.id);
}

function getElementsByClass(className) {
    return document.getElementsByClassName(removeSpaces(className));
}

function setLightDarkMode() {
    const body = document.getElementById('body');
    body.classList.toggle('dark');
}

function setSciFiMode() {
    const body = document.getElementById('body');
    body.classList.toggle('sci-fi');
}

// TODO remove this function, it's an anti-pattern
function removeSpaces(string) {
    return string.replace(/ /g, '');
}

function rebirthOne() {
    gameData.rebirthOneCount += 1;

    rebirthReset();
}

function rebirthTwo() {
    gameData.rebirthTwoCount += 1;
    gameData.evil += getEvilGain();

    rebirthReset();

    for (let taskName in gameData.taskData) {
        const task = gameData.taskData[taskName];
        task.maxLevel = 0;
    }
}

function rebirthReset() {
    setTab(jobTabButton, 'jobs');

    // TODO encapsulate with start data
    gameData.coins = 0;
    gameData.days = 365 * 14;
    gameData.currentJob = gameData.taskData['Beggar'];
    gameData.currentSkill = gameData.taskData['Concentration'];
    gameData.currentProperty = gameData.itemData['Homeless'];
    gameData.currentMisc = [];
    gameData.autoLearnEnabled = false;
    gameData.autoPromoteEnabled = false;

    for (let taskName in gameData.taskData) {
        const task = gameData.taskData[taskName];
        if (task.level > task.maxLevel) task.maxLevel = task.level;
        task.level = 0;
        task.xp = 0;
    }

    for (let key in gameData.requirements) {
        const requirement = gameData.requirements[key];
        if (requirement.completed && permanentUnlocks.includes(key)) continue;
        requirement.completed = false;
    }
}

function getLifespan() {
    const immortality = gameData.taskData['Immortality'];
    const superImmortality = gameData.taskData['Super immortality'];
    return baseLifespan * immortality.getEffect() * superImmortality.getEffect();
}

function isAlive() {
    const condition = gameData.days < getLifespan();
    const deathText = document.getElementById('deathText');
    if (!condition) {
        gameData.days = getLifespan();
        deathText.classList.remove('hidden');
    } else {
        deathText.classList.add('hidden');
    }
    return condition;
}

function assignMethods() {
    for (let key in gameData.taskData) {
        let task = gameData.taskData[key];
        if (task.baseData.income) {
            task.baseData = jobBaseData[task.name];
            task = Object.assign(new Job(jobBaseData[task.name]), task);

        } else {
            task.baseData = skillBaseData[task.name];
            task = Object.assign(new Skill(skillBaseData[task.name]), task);
        }
        gameData.taskData[key] = task;
    }

    for (let key in gameData.itemData) {
        let item = gameData.itemData[key];
        item.baseData = itemBaseData[item.name];
        item = Object.assign(new Item(itemBaseData[item.name]), item);
        gameData.itemData[key] = item;
    }

    for (let key in gameData.requirements) {
        let requirement = gameData.requirements[key];
        switch (requirement.type) {
            case 'task':
                requirement = Object.assign(new TaskRequirement(requirement.elements, requirement.requirements), requirement);
                break;
            case 'coins':
                requirement = Object.assign(new CoinRequirement(requirement.elements, requirement.requirements), requirement);
                break;
            case 'age':
                requirement = Object.assign(new AgeRequirement(requirement.elements, requirement.requirements), requirement);
                break;
            case 'evil':
                requirement = Object.assign(new EvilRequirement(requirement.elements, requirement.requirements), requirement);
                break;
        }

        const tempRequirement = tempData['requirements'][key];
        requirement.elements = tempRequirement.elements;
        requirement.requirements = tempRequirement.requirements;
        gameData.requirements[key] = requirement;
    }

    gameData.currentJob = gameData.taskData[gameData.currentJob.name];
    gameData.currentSkill = gameData.taskData[gameData.currentSkill.name];
    gameData.currentProperty = gameData.itemData[gameData.currentProperty.name];
    const newArray = [];
    for (let misc of gameData.currentMisc) {
        newArray.push(gameData.itemData[misc.name]);
    }
    gameData.currentMisc = newArray;
}

function replaceSaveDict(dict, saveDict) {
    for (let key in dict) {
        if (!(key in saveDict)) {
            saveDict[key] = dict[key];
        } else if (dict === gameData.requirements) {
            if (saveDict[key].type !== tempData['requirements'][key].type) {
                saveDict[key] = tempData['requirements'][key];
            }
        }
    }

    for (let key in saveDict) {
        if (!(key in dict)) {
            delete saveDict[key];
        }
    }
}

function saveGameData() {
    localStorage.setItem('gameDataSave', JSON.stringify(gameData));
}

function loadGameData() {
    const gameDataSave = JSON.parse(localStorage.getItem('gameDataSave'));

    if (gameDataSave !== null) {
        replaceSaveDict(gameData, gameDataSave);
        replaceSaveDict(gameData.requirements, gameDataSave.requirements);
        replaceSaveDict(gameData.taskData, gameDataSave.taskData);
        replaceSaveDict(gameData.itemData, gameDataSave.itemData);

        gameData = gameDataSave;
    }

    assignMethods();
}

function updateUI() {
    updateTaskRows();
    updateItemRows();
    updateRequiredRows(gameData.taskData, jobCategories);
    updateRequiredRows(gameData.taskData, skillCategories);
    updateRequiredRows(gameData.itemData, itemCategories);
    updateHeaderRows(jobCategories);
    updateHeaderRows(skillCategories);
    updateQuickTaskDisplay('job');
    updateQuickTaskDisplay('skill');
    hideEntities();
    updateText();
    updateBodyClasses();
}

function update() {
    increaseDays();
    autoPromote();
    autoLearn();
    doTask(gameData.currentJob);
    doTask(gameData.currentSkill);
    applyExpenses();
    updateUI();
}

function resetGameData() {
    localStorage.clear();
    location.reload();
}

function importGameData() {
    const importExportBox = document.getElementById('importExportBox');
    gameData = JSON.parse(window.atob(importExportBox.value));
    saveGameData();
    location.reload();
}

function exportGameData() {
    const importExportBox = document.getElementById('importExportBox');
    importExportBox.value = window.btoa(JSON.stringify(gameData));
}

//Init
function init() {
    createAllRows(jobCategories, 'jobTable');
    createAllRows(skillCategories, 'skillTable');
    createAllRows(itemCategories, 'itemTable');

    createData(gameData.taskData, jobBaseData);
    createData(gameData.taskData, skillBaseData);
    createData(gameData.itemData, itemBaseData);

    gameData.currentJob = gameData.taskData['Beggar'];
    gameData.currentSkill = gameData.taskData['Concentration'];
    gameData.currentProperty = gameData.itemData['Homeless'];
    gameData.currentMisc = [];

    gameData.requirements = createRequirements(getElementsByClass, getTaskElement, getItemElement);

    tempData['requirements'] = {};
    for (let key in gameData.requirements) {
        tempData['requirements'][key] = gameData.requirements[key];
    }

    loadGameData();

    setCustomEffects();
    addMultipliers();

    setTab(jobTabButton, 'jobs');
    autoLearnElement.checked = gameData.autoLearnEnabled;
    autoPromoteElement.checked = gameData.autoPromoteEnabled;

    update();
    setInterval(update, 1000 / updateSpeed);
    setInterval(saveGameData, 3000);
    setInterval(setSkillWithLowestMaxXp, 1000);
}

init();

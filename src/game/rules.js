"use strict"

// Formulas that only need the game data and the game state: speed, lifespan
// and multipliers. The job, skill and item classes use these, so they live
// apart from the rest of the engine.

const updateSpeed = 20

const baseLifespan = 365 * 70

const baseGameSpeed = 4

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

function getBindedTaskEffect(taskName) {
    const task = gameData.taskData[taskName]
    return task.getEffect.bind(task)
}

function getBindedItemEffect(itemName) {
    const item = gameData.itemData[itemName]
    return item.getEffect.bind(item)
}

function getSourceEffect(source) {
    return source.name in gameData.taskData ? getBindedTaskEffect(source.name) : getBindedItemEffect(source.name)
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

function getGameSpeed() {
    const timeWarpingSpeed = gameData.timeWarpingEnabled ? applyStatBoosts("gameSpeed", 1) : 1
    const gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed
    return gameSpeed
}

function daysToYears(days) {
    const years = Math.floor(days / 365)
    return years
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

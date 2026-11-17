// Formulas that only need the game data and the game state: speed, lifespan
// and multipliers. The job, skill and item classes use these, so they live
// apart from the rest of the engine.

import { skills, items } from "./data.ts"
import { gameData } from "./state.js"

export const updateSpeed = 20

export const baseLifespan = 365 * 70

export const baseGameSpeed = 4

export function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

export function getBindedTaskEffect(taskName) {
    const task = gameData.taskData[taskName]
    return task.getEffect.bind(task)
}

export function getBindedItemEffect(itemName) {
    const item = gameData.itemData[itemName]
    return item.getEffect.bind(item)
}

export function getSourceEffect(source) {
    return source.name in gameData.taskData ? getBindedTaskEffect(source.name) : getBindedItemEffect(source.name)
}

// Multiplies value by the effect of every skill and item that boosts a
// global stat (happiness, lifespan, gameSpeed, evilGain), in definition order
export function applyStatBoosts(stat, value) {
    for (const source of [...skills, ...items]) {
        for (const boost of source.boosts || []) {
            if (boost.stat == stat) value *= getSourceEffect(source)()
        }
    }
    return value
}

export function applyMultipliers(value, multipliers) {
    let finalMultiplier = 1
    multipliers.forEach(function(multiplierFunction) {
        const multiplier = multiplierFunction()
        finalMultiplier *= multiplier
    })
    const finalValue = Math.round(value * finalMultiplier)
    return finalValue
}

export function applySpeed(value) {
    return value * getGameSpeed() / updateSpeed
}

export function getGameSpeed() {
    const timeWarpingSpeed = gameData.timeWarpingEnabled ? applyStatBoosts("gameSpeed", 1) : 1
    const gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed
    return gameSpeed
}

export function daysToYears(days) {
    const years = Math.floor(days / 365)
    return years
}

export function getLifespan() {
    return applyStatBoosts("lifespan", baseLifespan)
}

// Also stops the age going past the lifespan
export function isAlive() {
    const condition = gameData.days < getLifespan()
    if (!condition) {
        gameData.days = getLifespan()
    }
    return condition
}

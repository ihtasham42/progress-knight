// Formulas that only need the game data and the game state: speed, lifespan
// and multipliers. The job, skill and item classes use these, so they live
// apart from the rest of the engine.

import { skills, items, events } from "./data.ts"
import { getEventEffect } from "./events.ts"
import { gameData } from "./state.ts"
import type { Skill } from "./classes.ts"
import type { GlobalStat, SkillDefinition, ItemDefinition } from "./types.ts"

export const updateSpeed = 20

const baseLifespan = 365 * 70

const baseGameSpeed = 4

export function getBaseLog(x: number, y: number): number {
    return Math.log(y) / Math.log(x);
}

function getBindedTaskEffect(taskName: string): () => number {
    // Only skills have an effect; this is only called for skills
    const task = gameData.taskData[taskName] as Skill
    return task.getEffect.bind(task)
}

function getBindedItemEffect(itemName: string): () => number {
    const item = gameData.itemData[itemName]
    return item.getEffect.bind(item)
}

export function getSourceEffect(source: SkillDefinition | ItemDefinition): () => number {
    return source.name in gameData.taskData ? getBindedTaskEffect(source.name) : getBindedItemEffect(source.name)
}

// Multiplies value by the effect of every skill and item that boosts a
// global stat (happiness, lifespan, gameSpeed, evilGain), in definition
// order, then by every event running that boosts it
export function applyStatBoosts(stat: GlobalStat, value: number): number {
    for (const source of [...skills, ...items]) {
        for (const boost of source.boosts || []) {
            if (boost.stat == stat) value *= getSourceEffect(source)()
        }
    }
    for (const event of events) {
        for (const effect of event.effects) {
            for (const boost of effect.boosts) {
                if (boost.stat == stat) value *= getEventEffect(event, effect)()
            }
        }
    }
    return value
}

export function applyMultipliers(value: number, multipliers: (() => number)[]): number {
    let finalMultiplier = 1
    multipliers.forEach(function(multiplierFunction) {
        const multiplier = multiplierFunction()
        finalMultiplier *= multiplier
    })
    const finalValue = Math.round(value * finalMultiplier)
    return finalValue
}

export function applySpeed(value: number): number {
    return value * getGameSpeed() / updateSpeed
}

export function getGameSpeed(): number {
    const timeWarpingSpeed = gameData.timeWarpingEnabled ? applyStatBoosts("gameSpeed", 1) : 1
    const gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed
    return gameSpeed
}

export function daysToYears(days: number): number {
    const years = Math.floor(days / 365)
    return years
}

export function getLifespan(): number {
    return applyStatBoosts("lifespan", baseLifespan)
}

// Also stops the age going past the lifespan
export function isAlive(): boolean {
    const condition = gameData.days < getLifespan()
    if (!condition) {
        gameData.days = getLifespan()
    }
    return condition
}

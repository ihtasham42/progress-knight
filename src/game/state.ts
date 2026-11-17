// The game state: one object that the game steps change and saves record.

import type { Job, Skill, Item, Requirement } from "./classes.js"

export interface GameData {
    taskData: Record<string, Job | Skill> // by name
    itemData: Record<string, Item> // by name

    coins: number
    days: number
    evil: number
    paused: boolean
    timeWarpingEnabled: boolean

    rebirthOneCount: number
    rebirthTwoCount: number

    currentJob: Job
    currentSkill: Skill
    currentProperty: Item
    currentMisc: Item[]

    requirements: Record<string, Requirement> // by name

    automation: {
        autoPromote: boolean
        autoLearn: boolean
        skippedSkills: Set<string> // skill ids
    }
}

// The current job, skill, items and the requirements only exist once
// initGameData() has built the jobs, skills and items, which happens before
// anything reads them. Until then they hold these placeholders.
const notBuiltYet = null as unknown as never

export const gameData: GameData = {
    taskData: {},
    itemData: {},

    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,

    rebirthOneCount: 0,
    rebirthTwoCount: 0,

    currentJob: notBuiltYet,
    currentSkill: notBuiltYet,
    currentProperty: notBuiltYet,
    currentMisc: notBuiltYet,

    requirements: notBuiltYet,

    // Saved since save version 4
    automation: {
        autoPromote: false,
        autoLearn: false,
        skippedSkills: new Set<string>(), // skill ids
    },
}

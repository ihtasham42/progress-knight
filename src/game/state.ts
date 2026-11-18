// The game state: one object that the game steps change and saves record.

import type { Job, Skill, Item, Requirement } from "./classes.ts"

// How a life ended: by touching the eye (Rebirth I) or embracing evil (Rebirth II)
export type LifeEnd = "rebirth" | "evil"

// The highest level a job or skill reached in a life. The id is kept rather
// than the name so a renamed task still resolves (unknown ids show as such).
export interface LifeBest {
    id: string
    level: number
}

// One finished life
export interface Life {
    life: number // 1-based across the whole save
    end: LifeEnd
    age: number // years
    job: LifeBest
    skill: LifeBest
    peakCoins: number
    evil: number // the evil gained, 0 unless the life ended in evil
}

// Past lives kept; older ones are dropped
export const MAX_LIVES = 50

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

    lives: Life[] // finished lives, newest last
    lifePeakCoins: number // the most coins held in this life so far
    furthestDay: number // the furthest world day any life has reached; it never goes down

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

    // Saved since save version 5
    lives: [],
    lifePeakCoins: 0,

    // Saved since save version 7
    furthestDay: 0,

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

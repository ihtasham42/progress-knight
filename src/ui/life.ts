// How far through its life the character is, for the life bars.

import { getLifespan } from "../game/rules.ts"

// The age the character starts at
const START_DAYS = 14 * 365

// From 0 (just started) to 1 (at the lifespan)
export function getLifeShare(days: number): number {
    return Math.min(1, Math.max(0, (days - START_DAYS) / (getLifespan() - START_DAYS)))
}

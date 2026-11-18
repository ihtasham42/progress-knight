// Types for the game data format (see the top of data.ts).

// What a skill or item multiplies by its effect
export type TargetedStat = "xp" | "income" | "expense"
export type GlobalStat = "happiness" | "lifespan" | "gameSpeed" | "evilGain"
export type Stat = TargetedStat | GlobalStat

// xp, income and expense boosts say what they apply to ("all", "jobs",
// "skills", "items", a category name or a task id); global stats don't.
export type Boost =
    | {readonly stat: TargetedStat, readonly of: string}
    | {readonly stat: GlobalStat, readonly of?: never}

// One condition for unlocking something. A definition's conditions are all
// of the same kind.
export type TaskRequirementSpec = {readonly task: string, readonly level: number, readonly coins?: never, readonly age?: never, readonly evil?: never}
export type CoinRequirementSpec = {readonly coins: number, readonly task?: never, readonly level?: never, readonly age?: never, readonly evil?: never}
export type AgeRequirementSpec = {readonly age: number, readonly task?: never, readonly level?: never, readonly coins?: never, readonly evil?: never}
export type EvilRequirementSpec = {readonly evil: number, readonly task?: never, readonly level?: never, readonly coins?: never, readonly age?: never}
export type RequirementSpec = TaskRequirementSpec | CoinRequirementSpec | AgeRequirementSpec | EvilRequirementSpec

// Replaces a skill's default effect of 1 + effect * level
export type EffectCurve =
    | {readonly type: "log", readonly base: number}
    | {readonly type: "logReduction", readonly base: number, readonly divisor: number, readonly minimum: number}

interface Definition {
    readonly id: string
    readonly name: string
    readonly requires: readonly RequirementSpec[]
}

interface TaskDefinition extends Definition {
    readonly category: string
    readonly maxXp: number
    readonly tooltip: string
}

export interface JobDefinition extends TaskDefinition {
    readonly income: number
}

export interface SkillDefinition extends TaskDefinition {
    readonly effect: number
    readonly description: string
    readonly effectCurve?: EffectCurve
    readonly boosts: readonly Boost[]
}

export interface ItemDefinition extends Definition {
    readonly category: string
    readonly expense: number
    readonly effect: number
    readonly tooltip: string
    // Properties have neither: their effect is always happiness
    readonly description?: string
    readonly boosts?: readonly Boost[]
}

// Reveals a category's rows, or a part of the page the page chooses.
// reveals: categories kept wholly out of sight (header and all) until this
//   unlock is reached. Until then the game doesn't hint they exist.
// hidesNext (category unlocks): once unlocked, the category doesn't preview
//   what its next locked row needs, so each one arrives as a surprise.
export interface UnlockDefinition extends Definition {
    readonly category?: string
    readonly reveals?: readonly string[]
    readonly hidesNext?: boolean
    readonly permanent?: boolean
}

// The world calendar. A year is its seasons, in order, and starts on the
// first day of the first one.
export interface SeasonDefinition {
    readonly id: string
    readonly name: string
    readonly days: number
}

export interface CalendarDefinition {
    readonly epochYear: number // the year world day 0 falls in
    readonly eraLabel: string
    readonly seasons: readonly SeasonDefinition[]
}

// Anything with its own unlock requirement
export type AnyDefinition = JobDefinition | SkillDefinition | ItemDefinition | UnlockDefinition

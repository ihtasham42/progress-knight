// Checked by npm run typecheck, never run. Each line below is a typo in game
// data that TypeScript must reject. If one stops being rejected, the
// expect-error comment above it is unused and typecheck fails.

import type { Boost, EffectCurve, JobDefinition, RequirementSpec } from "../../src/game/types.ts"
import type { BoostTarget, Category, TaskId } from "../../src/game/data.ts"

// @ts-expect-error -- a task id that doesn't exist
export const unknownTask: TaskId = "begger"
// @ts-expect-error -- a category that doesn't exist
export const unknownCategory: Category = "Dark majic"
// @ts-expect-error -- a boost target that doesn't exist
export const unknownTarget: BoostTarget = "Militry"
// @ts-expect-error -- a stat that doesn't exist
export const unknownStat: Boost = {stat: "happyness"}
// @ts-expect-error -- xp, income and expense boosts need a target
export const untargetedBoost: Boost = {stat: "xp"}
// @ts-expect-error -- global stats can't have a target
export const targetedGlobalStat: Boost = {stat: "lifespan", of: "all"}
// @ts-expect-error -- a task requirement needs a level
export const taskWithoutLevel: RequirementSpec = {task: "beggar"}
// @ts-expect-error -- one spec can only be one kind of requirement
export const mixedRequirement: RequirementSpec = {coins: 750, age: 25}
// @ts-expect-error -- an effect curve type that doesn't exist
export const unknownCurve: EffectCurve = {type: "logReduce", base: 7}
export const misspeltField: JobDefinition = {id: "beggar", name: "Beggar", category: "Common work", maxXp: 50,
    // @ts-expect-error -- a field that doesn't exist
    incom: 5, requires: [], tooltip: ""}

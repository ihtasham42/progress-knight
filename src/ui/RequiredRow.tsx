// The row under a category: what the next locked job, skill or item in it
// needs, or, while the whole category is locked, what unlocks it.

import { Fragment } from "react"
import { unlocks } from "../game/data.ts"
import { gameData } from "../game/state.ts"
import type { Job, Skill, Item, Requirement, TaskCondition } from "../game/classes.ts"
import { daysToYears } from "../game/rules.ts"
import { isUnlocked } from "../game/engine.ts"
import { CoinParts } from "./CoinParts.tsx"
import { classNames, removeSpaces } from "./classNames.ts"
import { format } from "./format.ts"

type Entity = Job | Skill | Item

// The next thing in the category that hasn't been unlocked, if any
function nextLocked(data: Record<string, Entity>, category: string[]): Entity | null {
    for (let i = 0; i < category.length; i++) {
        const entityName = category[i]
        if (i >= category.length - 1) break
        const requirements = gameData.requirements[entityName]
        if (requirements && i == 0) {
            if (!requirements.completed) {
                return data[entityName]
            }
        }

        const nextIndex = i + 1
        if (nextIndex >= category.length) {break}
        const nextEntityName = category[nextIndex]
        const nextEntityRequirements = gameData.requirements[nextEntityName]

        if (!nextEntityRequirements.completed) {
            return data[nextEntityName]
        }
    }
    return null
}

// One thing a requirement asks for, with how far along it is
interface Need {
    kind: Requirement["type"]
    label: string
    have: number
    need: number
}

function needsOf(requirement: Requirement): Need[] {
    const kind = requirement.type
    return requirement.requirements.map(condition => {
        if (kind == "task") {
            const task = (condition as TaskCondition).task
            return {kind, label: task, have: gameData.taskData[task].level, need: condition.requirement}
        }
        if (kind == "evil") return {kind, label: "Evil", have: gameData.evil, need: condition.requirement}
        if (kind == "age") return {kind, label: "Age", have: Math.floor(daysToYears(gameData.days)), need: condition.requirement}
        return {kind, label: "", have: gameData.coins, need: condition.requirement}
    })
}

function NeedChip({need}: {need: Need}) {
    const met = need.have >= need.need
    const progress = Math.min(100, Math.max(0, need.have / need.need * 100))
    return (
        <span className={classNames("need-chip", met && "met", need.kind == "evil" && "need-evil")}>
            {need.label && <span className="need-label">{need.label}</span>}
            {" "}
            <strong className="need-value">
                {need.kind == "coins"
                    ? <><CoinParts coins={need.have} /> / <CoinParts coins={need.need} /></>
                    : format(need.have) + " / " + format(need.need)}
            </strong>
            {/* The numbers carry the meaning; the bar is only a glance */}
            {" "}
            <span className="need-bar" aria-hidden="true"><span style={{width: progress + "%"}} /></span>
        </span>
    )
}

function LockIcon() {
    return (
        <svg className="lock-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
    )
}

// A locked category (e.g. Dark magic) shows its header and what unlocks it;
// its rows stay out of sight until then
export function isCategoryHidden(categoryName: string): boolean {
    const unlock = unlocks.find(unlock => unlock.category == categoryName)
    return unlock !== undefined && !isUnlocked(unlock.id)
}

export function RequiredRow({categoryName, category, items}: {categoryName: string, category: string[], items: boolean}) {
    const data: Record<string, Entity> = items ? gameData.itemData : gameData.taskData
    const locked = isCategoryHidden(categoryName)
    const unlock = unlocks.find(unlock => unlock.category == categoryName)
    const nextEntity = locked ? null : nextLocked(data, category)
    const requirement = locked && unlock ? gameData.requirements[unlock.name] : nextEntity ? gameData.requirements[nextEntity.name] : null
    const needs = requirement ? needsOf(requirement) : []
    const evilUnlock = locked && requirement?.type == "evil"

    // Its own row, so the table keeps one row per line; the cell spans every column
    return (
        <tr className="next-tr">
            <td id={categoryName} colSpan={7}
                className={classNames("requiredRow", removeSpaces(categoryName), locked && "locked", !locked && !nextEntity && "hiddenTask")}>
                <div className="next-row">
                    <span className={classNames("next-lead", evilUnlock && "need-evil")}>
                        <LockIcon />
                        {locked
                            ? <span>{evilUnlock ? "Embrace evil at the Amulet to unlock" : "Unlocks with"}</span>
                            : <span>Next: <strong>{nextEntity?.name}</strong></span>}
                    </span>
                    {needs.map((need, i) => <Fragment key={i}>{" "}<NeedChip need={need} /></Fragment>)}
                </div>
            </td>
        </tr>
    )
}

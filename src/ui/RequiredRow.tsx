// The "Required: ..." line under a category: what the next locked job, skill
// or item in it needs.

import { unlocks } from "../game/data.ts"
import { gameData } from "../game/state.ts"
import { EvilRequirement } from "../game/classes.ts"
import type { Job, Skill, Item, TaskCondition } from "../game/classes.ts"
import { isUnlocked } from "../game/engine.ts"
import { CoinParts, EmptyCoinParts } from "./CoinParts.tsx"
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

function levelsText(conditions: TaskCondition[]): string {
    let finalText = ""
    for (const requirement of conditions) {
        const task = gameData.taskData[requirement.task]
        if (task.level >= requirement.requirement) continue
        const text = " " + requirement.task + " level " + format(task.level) + "/" + format(requirement.requirement) + ","
        finalText += text
    }
    return finalText.substring(0, finalText.length - 1)
}

// Hidden while the category itself is locked (e.g. Dark magic)
export function isCategoryHidden(categoryName: string): boolean {
    const unlock = unlocks.find(unlock => unlock.category == categoryName)
    return unlock !== undefined && !isUnlocked(unlock.id)
}

export function RequiredRow({categoryName, category, items}: {categoryName: string, category: string[], items: boolean}) {
    const data: Record<string, Entity> = items ? gameData.itemData : gameData.taskData
    const nextEntity = nextLocked(data, category)

    let showLevels = false, showCoins = false, showEvil = false
    let levels = "", coins = 0, evil = ""
    if (nextEntity) {
        const requirement = gameData.requirements[nextEntity.name]
        showEvil = !items && requirement instanceof EvilRequirement
        showLevels = !items && !showEvil
        showCoins = items
        if (showEvil) evil = format(requirement.requirements[0].requirement) + " evil"
        // Jobs and skills need task levels unless they need evil
        else if (showLevels) levels = levelsText(requirement.requirements as TaskCondition[])
        else coins = requirement.requirements[0].requirement
    }

    // The cell sits straight in the table with no row box of its own, as it
    // always has, so the page reads "Required: ...", then the next category
    return (
        <tr style={{display: "contents"}}>
            <td id={categoryName} colSpan={5} style={{paddingLeft: "16px"}}
                className={classNames("w3-text-gray requiredRow", removeSpaces(categoryName),
                    isCategoryHidden(categoryName) && "hidden", !nextEntity && "hiddenTask")}>
                {" "}Required:{" "}
                <span className="value">
                    {" "}
                    <span className={classNames("levels", !showLevels && "hiddenTask")}>{levels}</span>
                    {" "}
                    <span className={classNames("coins", !showCoins && "hiddenTask")}>
                        {showCoins ? <CoinParts coins={coins} /> : <EmptyCoinParts />}
                    </span>
                    {" "}
                    <span style={{color: "rgb(200, 0, 0)"}} className={classNames("evil", !showEvil && "hiddenTask")}>{evil}</span>
                    {" "}
                </span>
                {" "}
            </td>
        </tr>
    )
}

// The Jobs and Skills tables: a header for each category, a row for each job
// or skill, and what the next one needs.

import { Fragment } from "react"
import type { CSSProperties } from "react"
import { headerRowColors, idsByName, jobCategories, skillCategories, tooltips } from "../game/data.ts"
import { Job, Skill } from "../game/classes.ts"
import { setSkillSkipped, setTask } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts, EmptyCoinParts } from "./CoinParts.tsx"
import { Checkbox } from "./Checkbox.tsx"
import { RequiredRow, isCategoryHidden } from "./RequiredRow.tsx"
import { classNames, removeSpaces } from "./classNames.ts"
import { format, splitEffect } from "./format.ts"

export type TaskKind = "jobs" | "skills"

// Skill name -> skips or unskips it (one function per skill, so it stays the
// same between renders)
const skipSkill: Record<string, (skipped: boolean) => void> = {}
for (const name of Object.values(skillCategories).flat()) {
    skipSkill[name] = skipped => setSkillSkipped(name, skipped)
}

export function TaskTable({kind}: {kind: TaskKind}) {
    const game = useGame()
    const categories = kind == "jobs" ? jobCategories : skillCategories
    return (
        <div className="table-scroll">
            <table id={kind == "jobs" ? "jobTable" : "skillTable"} className="w3-table w3-bordered task-table">
                <tbody>
                    {Object.entries(categories).map(([categoryName, names]) => (
                        <Fragment key={categoryName}>
                            <TaskHeaderRow kind={kind} categoryName={categoryName} />
                            {names.map(name => <TaskRow key={name} task={game.taskData[name]} categoryName={categoryName} />)}
                            <RequiredRow categoryName={categoryName} category={names} items={false} />
                        </Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function TaskHeaderRow({kind, categoryName}: {kind: TaskKind, categoryName: string}) {
    const game = useGame()
    return (
        <tr className={classNames(removeSpaces(categoryName), "headerRow", isCategoryHidden(categoryName) && "locked-header")}
            style={{"--cat": headerRowColors[categoryName as keyof typeof headerRowColors]} as CSSProperties}>
            <th className="category">{categoryName}</th>
            <th>Level</th>
            <th className="valueType">{kind == "jobs" ? "Income / day" : "Effect"}</th>
            <th>XP / day</th>
            <th>XP left</th>
            <th className={classNames("maxLevel", !(game.rebirthOneCount > 0) && "hidden")}>Max lvl</th>
            <th className="skipSkill" style={{display: kind == "skills" && game.automation.autoLearn ? "table-cell" : "none"}}>Skip</th>
        </tr>
    )
}

function TaskRow({task, categoryName}: {task: Job | Skill, categoryName: string}) {
    const game = useGame()
    const name = task.name
    const isCurrent = task == game.currentJob || task == game.currentSkill
    const effect = task instanceof Skill ? splitEffect(task.getEffectDescription()) : null
    const tooltipId = "tip-" + removeSpaces(name)
    // A locked category keeps its rows out of sight, whatever they need
    const hidden = !game.requirements[name].completed || isCategoryHidden(categoryName)
    return (
        <tr id={"row " + name} className={classNames(hidden && "hidden")}
            style={{"--cat": headerRowColors[categoryName as keyof typeof headerRowColors]} as CSSProperties}>
            <td>
                {/* A real button, so the keyboard can start the task too */}
                <button type="button" className="progress-bar progressBar tooltip" aria-describedby={tooltipId} onClick={() => {setTask(name); requestRender()}}>
                    <span className={classNames("progress-fill progressFill", isCurrent && "current")}
                        style={{width: task.xp / task.getMaxXp() * 100 + "%"}}></span>
                    <span className="progress-text name">{name}</span>
                    <span className="bar-end">
                        {isCurrent && <span className="active-badge">Active</span>}
                        {/* Phones show the level inside the bar (hidden from 640px) */}
                        <span className="phone-level">{"lvl " + task.level}</span>
                    </span>
                    <span className="tooltipText" id={tooltipId} aria-hidden="true">{tooltips[name]}</span>
                </button>
            </td>
            <td className="level">{task.level}</td>
            <td className="value">
                <div className="effect">{effect && <><strong>{effect.multiplier}</strong> <span>{effect.what}</span></>}</div>
                <div className="income">{task instanceof Job ? <CoinParts coins={task.getIncome()} /> : <EmptyCoinParts />}</div>
            </td>
            <td className="xpGain">{format(task.getXpGain())}</td>
            <td className="xpLeft">{format(task.getXpLeft())}</td>
            <td className={classNames("maxLevel", !(game.rebirthOneCount > 0) && "hidden")}>{task.maxLevel}</td>
            <td className="skipSkill" style={{display: task instanceof Skill && game.automation.autoLearn ? "table-cell" : "none"}}>
                {" "}
                {/* The label makes the whole 44px cell on phones tap to toggle */}
                <label className="skip-label"><Checkbox className="checkbox" ariaLabel={"Skip " + name} checked={task instanceof Skill && game.automation.skippedSkills.has(idsByName[name])}
                    onToggle={task instanceof Skill ? skipSkill[name] : undefined} /></label>
                {" "}
            </td>
        </tr>
    )
}

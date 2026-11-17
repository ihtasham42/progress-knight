// The Jobs and Skills tables: a header for each category, a row for each job
// or skill, and what the next one needs.

import { Fragment } from "react"
import { headerRowColors, idsByName, jobCategories, skillCategories, tooltips } from "../game/data.ts"
import { Job, Skill } from "../game/classes.ts"
import { setSkillSkipped, setTask } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts, EmptyCoinParts } from "./CoinParts.tsx"
import { Checkbox } from "./Checkbox.tsx"
import { RequiredRow, isCategoryHidden } from "./RequiredRow.tsx"
import { classNames, removeSpaces } from "./classNames.ts"
import { format } from "./format.ts"

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
        <table id={kind == "jobs" ? "jobTable" : "skillTable"} className="w3-table w3-bordered">
            <tbody>
                {Object.entries(categories).map(([categoryName, names]) => (
                    <Fragment key={categoryName}>
                        <TaskHeaderRow kind={kind} categoryName={categoryName} />
                        {names.map(name => <TaskRow key={name} task={game.taskData[name]} />)}
                        <RequiredRow categoryName={categoryName} category={names} items={false} />
                    </Fragment>
                ))}
            </tbody>
        </table>
    )
}

function TaskHeaderRow({kind, categoryName}: {kind: TaskKind, categoryName: string}) {
    const game = useGame()
    return (
        <tr className={classNames(removeSpaces(categoryName), "headerRow", isCategoryHidden(categoryName) && "hidden")}
            style={{backgroundColor: headerRowColors[categoryName as keyof typeof headerRowColors], color: "var(--pk-on-category)"}}>
            <th className="category" style={{width: "250px"}}>{categoryName}</th>
            <th>Level</th>
            <th className="valueType">{kind == "jobs" ? "Income/day" : "Effect"}</th>
            <th>Xp/day</th>
            <th>Xp left</th>
            <th className={classNames("maxLevel", !(game.rebirthOneCount > 0) && "hidden")}>Max level</th>
            <th className="skipSkill" style={{display: kind == "skills" && game.automation.autoLearn ? "block" : "none"}}>Skip</th>
        </tr>
    )
}

function TaskRow({task}: {task: Job | Skill}) {
    const game = useGame()
    const name = task.name
    const isCurrent = task == game.currentJob || task == game.currentSkill
    return (
        <tr id={"row " + name} className={classNames(!game.requirements[name].completed && "hidden")}>
            <td>
                <div className="progress-bar progressBar tooltip" onClick={() => {setTask(name); requestRender()}}>
                    <div className={classNames("progress-fill progressFill", isCurrent && "current")}
                        style={{width: task.xp / task.getMaxXp() * 100 + "%"}}></div>
                    <div className="progress-text name">{name}</div>
                    <span className="tooltipText">{tooltips[name]}</span>
                </div>
            </td>
            <td className="level">{task.level}</td>
            <td className="value">
                <div className="effect">{task instanceof Skill ? task.getEffectDescription() : ""}</div>
                <div className="income">{task instanceof Job ? <CoinParts coins={task.getIncome()} /> : <EmptyCoinParts />}</div>
            </td>
            <td className="xpGain">{format(task.getXpGain())}</td>
            <td className="xpLeft">{format(task.getXpLeft())}</td>
            <td className={classNames("maxLevel", !(game.rebirthOneCount > 0) && "hidden")}>{task.maxLevel}</td>
            <td className="skipSkill" style={{display: task instanceof Skill && game.automation.autoLearn ? "block" : "none"}}>
                {" "}
                <Checkbox className="checkbox" checked={task instanceof Skill && game.automation.skippedSkills.has(idsByName[name])}
                    onToggle={task instanceof Skill ? skipSkill[name] : undefined} />
                {" "}
            </td>
        </tr>
    )
}

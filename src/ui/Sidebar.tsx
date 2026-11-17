// The cards on the left: purse, the current job and skill, happiness, evil,
// time warping and automation.

import type { Job, Skill } from "../game/classes.ts"
import type { GameData } from "../game/state.ts"
import { items, skills } from "../game/data.ts"
import { getSourceEffect } from "../game/rules.ts"
import { getExpense, getHappiness, getIncome, getNet, getTaskById, isUnlocked,
    setAutoLearn, setAutoPromote, setTimeWarping } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts } from "./CoinParts.tsx"
import { Checkbox } from "./Checkbox.tsx"
import { classNames } from "./classNames.ts"
import { format } from "./format.ts"
import { fillStyle } from "./fill.ts"

export function Sidebar() {
    const game = useGame()
    const glows = game.evil > 0
    const income = getIncome()
    const expense = getExpense()
    const sign = income > expense ? {text: "+", color: "var(--pk-gain)"} : expense > income ? {text: "-", color: "var(--pk-loss)"} : {text: "", color: "var(--pk-text-muted)"}
    // Time warping is a skill (data.ts)
    const timeWarping = getTaskById("time_warping") as Skill
    return (
        <aside className="sidebar">
            <section className="card">
                <h2 className="card-label purse-label">Purse</h2>
                <div className="purse-main">
                    <div className="purse-coins" id="coinDisplay"><CoinParts coins={game.coins} /></div>
                    <div className="purse-net"><b id="signDisplay" style={{color: sign.color}}>{sign.text}</b><b id="netDisplay"><CoinParts coins={getNet()} /></b>a day</div>
                </div>
                <div className="card-note-list purse-notes">
                    <span><span id="incomeDisplay"><CoinParts coins={income} /></span>earned from {game.currentJob.name}</span>
                    <span><span id="expenseDisplay"><CoinParts coins={expense} /></span>upkeep · {[game.currentProperty, ...game.currentMisc].map(item => item.name).join(", ")}</span>
                </div>
            </section>
            <section id="quickTaskDisplay" className={classNames("card", !isUnlocked("quick_task_display") && "hidden")}>
                <h2 className="card-label">Working on</h2>
                <QuickTask task={game.currentJob} kind="Job" className="job" />
                <QuickTask task={game.currentSkill} kind="Skill" className="skill" />
            </section>
            <section className="card card-stats">
                <div className="stat">
                    <span className="stat-line"><span className="stat-value" id="happinessDisplay">{"×" + getHappiness().toFixed(1)}</span> <span className="stat-name stat-happiness">happiness</span></span>
                    <span className="card-note">{getHappinessNote(game)}</span>
                </div>
                <div id="evilInfo" className={classNames("stat", !isUnlocked("evil_info") && "hidden")}>
                    {/* Once there is some evil, it smoulders (fx-anim: the effects setting can turn it off) */}
                    <span className="stat-line"><span className={classNames("stat-value", glows && "evil-glow fx-anim")} id="evilDisplay">{game.evil.toFixed(1)}</span> <span className={classNames("stat-name stat-evil", glows && "evil-glow fx-anim")}>evil</span></span>
                    <span className="card-note">On dark magic XP</span>
                </div>
                <div id="timeWarping" className={classNames("stat", !isUnlocked("time_warping_info") && "hidden")}>
                    <span className="stat-line"><span className="stat-value" id="timeWarpingDisplay">{"×" + timeWarping.getEffect().toFixed(2)}</span> <span className="stat-name stat-time">time warping</span></span>
                    <span className="card-note">On game speed</span>
                    <button type="button" id="timeWarpingButton" className="w3-button button warp-button" onClick={() => {setTimeWarping(); requestRender()}}>
                        {game.timeWarpingEnabled ? "Disable warp" : "Enable warp"}
                    </button>
                </div>
                <div id="automation" className={classNames("automation", !isUnlocked("automation") && "hidden")}>
                    <h2 className="card-label">Automation</h2>
                    <label className="automation-row">Auto-promote <Checkbox className="automation-check" id="autoPromote" checked={game.automation.autoPromote} onToggle={setAutoPromote} /></label>
                    <label className="automation-row">Auto-learn <Checkbox className="automation-check" id="autoLearn" checked={game.automation.autoLearn} onToggle={setAutoLearn} /></label>
                </div>
            </section>
        </aside>
    )
}

// "On all XP · Cottage ×3.5, Meditation ×1.2": the property and every skill
// or item that boosts happiness, left out when it does nothing (×1)
function getHappinessNote(game: GameData): string {
    const factors: [string, number][] = [[game.currentProperty.name, game.currentProperty.getEffect()]]
    for (const source of [...skills, ...items]) {
        if (source.boosts?.some(boost => boost.stat == "happiness")) factors.push([source.name, getSourceEffect(source)()])
    }
    const shown = factors.filter(([, effect]) => effect != 1).map(([name, effect]) => name + " ×" + Number(effect.toFixed(2)))
    return shown.length ? "On all XP · " + shown.join(", ") : "On all XP"
}

// How long the current job or skill needs for its next level, in game days
function getNextLevelText(task: Job | Skill): string {
    const gain = task.getXpGain()
    if (gain <= 0) return "paused"
    const days = Math.max(1, Math.ceil(task.getXpLeft() / gain))
    return "next level in " + format(days) + (days == 1 ? " day" : " days")
}

// The current job or skill: a bar with its level and progress, and a muted line under it
function QuickTask({task, kind, className}: {task: Job | Skill, kind: string, className: string}) {
    return (
        <div className="quick-task">
            <div className={classNames("quick-bar", className)}>
                {/* Keyed so a level-up or a new task resets the bar instead of sliding it back */}
                <div key={task.name + " " + task.level} className="quick-fill" style={fillStyle(task.xp / task.getMaxXp())}></div>
                <div className="quick-text">
                    <span className="name">{task.name}</span>
                    <span className="quick-level">{"lvl " + task.level}</span>
                </div>
            </div>
            <span className="card-note">{kind + " · " + getNextLevelText(task)}</span>
        </div>
    )
}

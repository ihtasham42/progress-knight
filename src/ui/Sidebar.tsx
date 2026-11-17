// The panel on the left: age, coins, income, happiness, evil, time warping,
// automation and the current job and skill.

import type { Job, Skill } from "../game/classes.ts"
import { daysToYears, getLifespan } from "../game/rules.ts"
import { getDay, getExpense, getHappiness, getIncome, getNet, getTaskById, isLifeOver, isUnlocked,
    setAutoLearn, setAutoPromote, setPause, setTimeWarping } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts } from "./CoinParts.tsx"
import { Checkbox } from "./Checkbox.tsx"
import { classNames } from "./classNames.ts"

export function Sidebar() {
    const game = useGame()
    const income = getIncome()
    const expense = getExpense()
    const sign = income > expense ? {text: "+", color: "var(--pk-gain)"} : expense > income ? {text: "-", color: "var(--pk-loss)"} : {text: "", color: "var(--pk-text-muted)"}
    // Time warping is a skill (data.ts)
    const timeWarping = getTaskById("time_warping") as Skill
    return (
        <div className="panel sidebar">
            {" "}
            <span id="deathText" className={classNames("sidebar-death", !isLifeOver() && "hidden")}>
                {" "}
                <div style={{fontSize: "large", color: "var(--pk-loss)"}}>Age has caught up to you</div>
                {" "}
                <div className="sidebar-element" style={{color: "var(--pk-text-muted)"}}>Your age has met your lifespan, use the amulet to rebirth before you pass away</div>
                {" "}
            </span>
            {" "}
            <div className="sidebar-age" style={{fontSize: "large"}}>Age <span id="ageDisplay">{daysToYears(game.days)}</span> Day <span id="dayDisplay">{getDay()}</span></div>
            {" "}
            <div className="sidebar-element sidebar-age" style={{color: "var(--pk-text-muted)"}}>Lifespan: <span id="lifespanDisplay">{daysToYears(getLifespan())}</span> years</div>
            {" "}
            <button id="pauseButton" className="w3-button button sidebar-element sidebar-pause" onClick={() => {setPause(); requestRender()}}>
                {game.paused ? "Play" : "Pause"}
            </button>
            {" "}
            <span id="automation" className={classNames("inline", !isUnlocked("automation") && "hidden")} style={{marginLeft: "8px"}}>
                {" "}
                <span>
                    {" "}
                    <div className="inline">Auto-promote</div>
                    {" "}
                    <Checkbox className="inline" id="autoPromote" checked={game.automation.autoPromote} onToggle={setAutoPromote} />
                    {" "}
                </span>
                {" "}
                <br />
                {" "}
                <span>
                    {" "}
                    <div className="inline">Auto-learn</div>
                    {" "}
                    <Checkbox className="inline sidebar-element" id="autoLearn" checked={game.automation.autoLearn} onToggle={setAutoLearn} />
                    {" "}
                </span>
                {" "}
            </span>
            {" "}
            <div className="sidebar-coins" style={{fontSize: "large"}} id="coinDisplay"><CoinParts coins={game.coins} /></div>
            {" "}
            <div className="sidebar-coins" style={{color: "var(--pk-text-muted)"}}>Balance (in coins)</div>
            {" "}
            <ul className="sidebar-element" style={{paddingLeft: "20px"}}>
                {" "}
                <li><span style={{color: "var(--pk-info)"}}>Net/day: </span><b id="signDisplay" style={{color: sign.color}}>{sign.text}</b><span id="netDisplay"><CoinParts coins={getNet()} /></span></li>
                {" "}
                <li><span style={{color: "var(--pk-gain)"}}>Income/day: </span><span id="incomeDisplay"><CoinParts coins={income} /></span></li>
                {" "}
                <li><span style={{color: "var(--pk-loss)"}}>Expense/day: </span><span id="expenseDisplay"><CoinParts coins={expense} /></span></li>
                {" "}
            </ul>
            {" "}
            <span id="quickTaskDisplay" className={classNames(!isUnlocked("quick_task_display") && "hidden")}>
                {" "}
                <QuickTask task={game.currentJob} className="small-margin inline job progress-bar progressBar quick-task" />
                {" "}
                <div className="sidebar-element" style={{color: "var(--pk-text-muted)"}}>Current job</div>
                {" "}
                <QuickTask task={game.currentSkill} className="small-margin skill progress-bar progressBar quick-task" />
                {" "}
                <div className="sidebar-element" style={{color: "var(--pk-text-muted)"}}>Current skill</div>
                {" "}
            </span>
            {" "}
            <div style={{fontSize: "large"}}><span style={{color: "var(--pk-stat-happiness)"}}>Happiness: </span><span id="happinessDisplay">{getHappiness().toFixed(1)}</span></div>
            {" "}
            <div style={{color: "var(--pk-text-muted)"}} className="sidebar-element">Affects all xp gain</div>
            {" "}
            <span id="evilInfo" className={classNames(!isUnlocked("evil_info") && "hidden")}>
                {" "}
                <div style={{fontSize: "large"}}><span style={{color: "var(--pk-stat-evil)"}}>Evil: </span><span id="evilDisplay">{game.evil.toFixed(1)}</span></div>
                {" "}
                <div style={{color: "var(--pk-text-muted)"}} className="sidebar-element">Affects dark magic xp gain</div>
                {" "}
            </span>
            {" "}
            <span id="timeWarping" className={classNames(!isUnlocked("time_warping_info") && "hidden")}>
                {" "}
                <div style={{fontSize: "large"}}><span style={{color: "var(--pk-stat-time)"}}>Time warping: </span><span id="timeWarpingDisplay">{"x" + timeWarping.getEffect().toFixed(2)}</span></div>
                {" "}
                <div style={{color: "var(--pk-text-muted)"}}>Affects game speed</div>
                {" "}
                <button id="timeWarpingButton" className="w3-button button sidebar-element" style={{marginTop: "5px", width: "150px"}}
                    onClick={() => {setTimeWarping(); requestRender()}}>
                    {game.timeWarpingEnabled ? "Disable warp" : "Enable warp"}
                </button>
                {" "}
            </span>
            {" "}
        </div>
    )
}

// The current job or skill with its level and progress
function QuickTask({task, className}: {task: Job | Skill, className: string}) {
    return (
        <div className={className}>
            {" "}
            <div className="progress-fill progressFill" style={{backgroundColor: "var(--pk-bar-current)", width: task.xp / task.getMaxXp() * 100 + "%"}}></div>
            {" "}
            <div className="progress-text name">{task.name + " lvl " + task.level}</div>
            {" "}
        </div>
    )
}


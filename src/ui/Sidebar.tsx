// The panel on the left: age, coins, income, happiness, evil, time warping,
// automation and the current job and skill.

import type { Job, Skill } from "../game/classes.ts"
import { daysToYears, getLifespan } from "../game/rules.ts"
import { getDay, getExpense, getHappiness, getIncome, getNet, getTaskById, isLifeOver, isUnlocked,
    setAutoLearn, setAutoPromote, setPause, setTimeWarping } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts } from "./CoinParts.tsx"
import { classNames } from "./classNames.ts"

export function Sidebar() {
    const game = useGame()
    const income = getIncome()
    const expense = getExpense()
    const sign = income > expense ? {text: "+", color: "green"} : expense > income ? {text: "-", color: "red"} : {text: "", color: "gray"}
    // Time warping is a skill (data.ts)
    const timeWarping = getTaskById("time_warping") as Skill
    return (
        <div className="panel w3-padding" style={{width: "300px", height: "auto", float: "left"}}>
            {" "}
            <span id="deathText" className={classNames(!isLifeOver() && "hidden")}>
                {" "}
                <div style={{fontSize: "large", color: "red"}}>Age has caught up to you</div>
                {" "}
                <div className="sidebar-element" style={{color: "gray"}}>Your age has met your lifespan, use the amulet to rebirth before you pass away</div>
                {" "}
            </span>
            {" "}
            <div className="" style={{fontSize: "large"}}>Age <span id="ageDisplay">{daysToYears(game.days)}</span> Day <span id="dayDisplay">{getDay()}</span></div>
            {" "}
            <div className="sidebar-element" style={{color: "gray"}}>Lifespan: <span id="lifespanDisplay">{daysToYears(getLifespan())}</span> years</div>
            {" "}
            <button id="pauseButton" className="w3-button button sidebar-element" onClick={() => {setPause(); requestRender()}}>
                {game.paused ? "Play" : "Pause"}
            </button>
            {" "}
            <span id="automation" className={classNames("inline", !isUnlocked("automation") && "hidden")} style={{marginLeft: "8px"}}>
                {" "}
                <span>
                    {" "}
                    <div className="inline">Auto-promote</div>
                    {" "}
                    <input type="checkbox" className="inline" id="autoPromote" checked={game.automation.autoPromote}
                        onChange={event => {setAutoPromote(event.target.checked); requestRender()}} />
                    {" "}
                </span>
                {" "}
                <br />
                {" "}
                <span>
                    {" "}
                    <div className="inline">Auto-learn</div>
                    {" "}
                    <input type="checkbox" className="inline sidebar-element" id="autoLearn" checked={game.automation.autoLearn}
                        onChange={event => {setAutoLearn(event.target.checked); requestRender()}} />
                    {" "}
                </span>
                {" "}
            </span>
            {" "}
            <div style={{fontSize: "large"}} id="coinDisplay"><CoinParts coins={game.coins} /></div>
            {" "}
            <div style={{color: "gray"}}>Balance (in coins)</div>
            {" "}
            <ul className="sidebar-element" style={{paddingLeft: "20px"}}>
                {" "}
                <li><span style={{color: "rgb(9, 160, 230)"}}>Net/day: </span><b id="signDisplay" style={{color: sign.color}}>{sign.text}</b><span id="netDisplay"><CoinParts coins={getNet()} /></span></li>
                {" "}
                <li><span style={{color: "green"}}>Income/day: </span><span id="incomeDisplay"><CoinParts coins={income} /></span></li>
                {" "}
                <li><span style={{color: "red"}}>Expense/day: </span><span id="expenseDisplay"><CoinParts coins={expense} /></span></li>
                {" "}
            </ul>
            {" "}
            <span id="quickTaskDisplay" className={classNames(!isUnlocked("quick_task_display") && "hidden")}>
                {" "}
                <QuickTask task={game.currentJob} className="small-margin inline job progress-bar progressBar" />
                {" "}
                <div className="sidebar-element" style={{color: "gray"}}>Current job</div>
                {" "}
                <QuickTask task={game.currentSkill} className="small-margin skill progress-bar progressBar" />
                {" "}
                <div className="sidebar-element" style={{color: "gray"}}>Current skill</div>
                {" "}
            </span>
            {" "}
            <div style={{fontSize: "large"}}><span style={{color: "rgb(15, 105, 207)"}}>Happiness: </span><span id="happinessDisplay">{getHappiness().toFixed(1)}</span></div>
            {" "}
            <div style={{color: "gray"}} className="sidebar-element">Affects all xp gain</div>
            {" "}
            <span id="evilInfo" className={classNames(!isUnlocked("evil_info") && "hidden")}>
                {" "}
                <div style={{fontSize: "large"}}><span style={{color: "rgb(200, 0, 0)"}}>Evil: </span><span id="evilDisplay">{game.evil.toFixed(1)}</span></div>
                {" "}
                <div style={{color: "gray"}} className="sidebar-element">Affects dark magic xp gain</div>
                {" "}
            </span>
            {" "}
            <span id="timeWarping" className={classNames(!isUnlocked("time_warping_info") && "hidden")}>
                {" "}
                <div style={{fontSize: "large"}}><span style={{color: "rgb(204, 34, 219)"}}>Time warping: </span><span id="timeWarpingDisplay">{"x" + timeWarping.getEffect().toFixed(2)}</span></div>
                {" "}
                <div style={{color: "gray"}}>Affects game speed</div>
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
        <div style={{width: "230px"}} className={className}>
            {" "}
            <div className="progress-fill progressFill" style={{backgroundColor: "rgb(225, 165, 0)", width: task.xp / task.getMaxXp() * 100 + "%"}}></div>
            {" "}
            <div className="progress-text name">{task.name + " lvl " + task.level}</div>
            {" "}
        </div>
    )
}


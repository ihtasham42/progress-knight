// The compact header on phones: title, pause button, coins, net per day,
// age and a life bar. Header.tsx holds the same numbers behind ids (tests
// and wider screens use those), so this uses classes only.

import { daysToYears, getLifespan } from "../game/rules.ts"
import { getDay, getExpense, getIncome, getNet, isLifeOver, setPause } from "../game/engine.ts"
import { requestRender, useGame } from "./gameStore.ts"
import { CoinParts } from "./CoinParts.tsx"
import { getLifeShare } from "./life.ts"

export function PhoneHeader() {
    const game = useGame()
    const income = getIncome()
    const expense = getExpense()
    const sign = income > expense ? {text: "+", color: "var(--pk-gain)"} : expense > income ? {text: "-", color: "var(--pk-loss)"} : {text: "", color: "var(--pk-text-muted)"}
    const lifespan = getLifespan()
    const lifeShare = getLifeShare(game.days)
    const age = daysToYears(game.days)
    return (
        <header className="phone-header">
            <div className="phone-header-row">
                <span className="phone-header-title">Progress Knight</span>
                <button type="button" className="phone-header-pause" aria-label={game.paused ? "Play" : "Pause"} onClick={() => {setPause(); requestRender()}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {game.paused ? <path d="M7 5l12 7-12 7z" /> : <path d="M8 5v14M16 5v14" />}
                    </svg>
                </button>
            </div>
            <div className="phone-header-row">
                <span className="phone-header-coins"><CoinParts coins={game.coins} /></span>
                <span className="phone-header-net">
                    <span style={{color: sign.color}}>{sign.text}</span><CoinParts coins={getNet()} />/ day
                </span>
            </div>
            <div className="phone-header-row phone-header-muted">
                <span>Age <b>{age}</b> · Day <b>{getDay()}</b></span>
                <span>Lifespan {daysToYears(lifespan)}</span>
            </div>
            <div className="life-bar" role="img" aria-label={"Age " + age + " of " + daysToYears(lifespan)}>
                <div className="life-bar-fill" style={{width: lifeShare * 100 + "%"}}></div>
            </div>
            {isLifeOver() && <div className="phone-header-death">Age has caught up to you</div>}
        </header>
    )
}

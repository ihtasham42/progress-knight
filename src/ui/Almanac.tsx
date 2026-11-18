// The Almanac, a small sidebar card: today's date, the days to the next
// season, how far through this season the world is, and a way to the
// Chronicle in Settings. It appears with the Amulet tab, and stays once a
// life has been lived.

import { calendar } from "../game/data.ts"
import type { SeasonId } from "../game/data.ts"
import { daysLeftInSeason, formatDate, getWorldDay, toDate } from "../game/calendar.ts"
import { isUnlocked } from "../game/engine.ts"
import { gameData } from "../game/state.ts"
import { useGame } from "./gameStore.ts"
import { classNames } from "./classNames.ts"
import { fillStyle } from "./fill.ts"
import { SeasonIcon } from "./SeasonIcon.tsx"

// Whether the calendar's history is shown yet: the Almanac, and the
// Chronicle in Settings. The Amulet tab hides again at each rebirth, so a
// life already lived keeps them in sight.
export function isHistoryShown(): boolean {
    return isUnlocked("rebirth_tab") || gameData.lives.length > 0
}

export function Almanac({onOpenChronicle}: {onOpenChronicle: () => void}) {
    useGame()
    const today = getWorldDay()
    const date = toDate(today)
    const season = date.season
    const next = calendar.seasons[(date.seasonIndex + 1) % calendar.seasons.length]
    const left = daysLeftInSeason(today)
    return (
        <section id="almanac" aria-labelledby="almanacLabel" className={classNames("card almanac", !isHistoryShown() && "hidden")}>
            <h2 id="almanacLabel" className="card-label">Almanac</h2>
            <div className="almanac-now">
                <div className="almanac-line">
                    <span className="almanac-date"><SeasonIcon season={season.id as SeasonId} /><span id="almanacDate">{formatDate(date)}</span></span>
                    <span className="card-note almanac-next">{left + (left == 1 ? " day" : " days") + " to " + next.name}</span>
                </div>
                <div className="life-bar almanac-bar" role="img" aria-label={season.name + ", day " + date.dayOfSeason + " of " + season.days}>
                    {/* Keyed so a new season starts its bar afresh instead of sliding it back */}
                    <div key={date.year + " " + season.id} className="life-bar-fill"
                        style={{...fillStyle((date.dayOfSeason - 1) / season.days), backgroundColor: "var(--pk-season-" + season.id + ")"}}></div>
                </div>
            </div>
            <button type="button" className="almanac-link" onClick={onOpenChronicle}>
                Chronicle in Settings
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
            </button>
        </section>
    )
}

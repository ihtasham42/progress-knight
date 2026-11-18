// The Almanac, a small sidebar card: today's date, the days to the next
// season, how far through this season the world is, the events running or
// the next one, and a way to the Chronicle in Settings. "Coming up" opens a
// list of the next few events. It appears with the Amulet tab, and stays
// once a life has been lived.

import { useState } from "react"
import { calendar } from "../game/data.ts"
import type { SeasonId } from "../game/data.ts"
import { daysLeftInSeason, formatDate, getWorldDay, toDate } from "../game/calendar.ts"
import { isUnlocked } from "../game/engine.ts"
import { gameData } from "../game/state.ts"
import { getActiveEvents, getUpcomingEvents, isNew } from "../game/events.ts"
import type { EventOccurrence } from "../game/events.ts"
import { effectColor, effectText, seasonYearText, untilText } from "./eventText.ts"
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

// Events listed under "Coming up"
const UPCOMING_EVENTS = 3

export function Almanac({onOpenChronicle}: {onOpenChronicle: () => void}) {
    useGame()
    const [expanded, setExpanded] = useState(false)
    const today = getWorldDay()
    const date = toDate(today)
    const season = date.season
    const next = calendar.seasons[(date.seasonIndex + 1) % calendar.seasons.length]
    const left = daysLeftInSeason(today)
    const running = getActiveEvents()
    const upcoming = getUpcomingEvents(today, UPCOMING_EVENTS)
    const showList = expanded && upcoming.length > 0
    return (
        <section id="almanac" aria-labelledby="almanacLabel" className={classNames("card almanac", !isHistoryShown() && "hidden")}>
            <div className="almanac-head">
                <h2 id="almanacLabel" className="card-label">Almanac</h2>
                {upcoming.length > 0 && (
                    <button type="button" className="almanac-toggle" aria-expanded={showList} aria-controls="almanacUpcoming" onClick={() => setExpanded(!expanded)}>
                        {showList ? "Hide" : "Coming up"}
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={classNames("almanac-chevron", showList && "almanac-chevron-open")}><path d="m6 9 6 6 6-6"></path></svg>
                    </button>
                )}
            </div>
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
            {running.map(occurrence => <EventBox key={occurrence.event.id} occurrence={occurrence} today={today} />)}
            {showList && (
                <div id="almanacUpcoming" className="almanac-upcoming">
                    <h3 className="card-label">Coming up</h3>
                    {upcoming.map(occurrence => (
                        <div key={occurrence.event.id + " " + occurrence.year} className="almanac-coming">
                            <span className="almanac-line">
                                <span className="almanac-coming-name"><SeasonIcon season={occurrence.event.season as SeasonId} size={14} />{occurrence.event.name}</span>
                                {" "}
                                <span className="card-note">{untilText(occurrence.start - today)}</span>
                            </span>
                            {" "}
                            <span className="card-note">{seasonYearText(occurrence) + " · " + occurrence.event.effects.map(effectText).join(", ")}</span>
                        </div>
                    ))}
                </div>
            )}
            {running.length == 0 && !showList && upcoming.length > 0 && (
                <span className="card-note almanac-line almanac-next-event">
                    <span>Next: <strong>{upcoming[0].event.name}</strong></span>
                    {" "}
                    <span>{untilText(upcoming[0].start - today)}</span>
                </span>
            )}
            <button type="button" className="almanac-link" onClick={onOpenChronicle}>
                Chronicle in Settings
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
            </button>
        </section>
    )
}

// An event running now: its name, "Began" for its first days, the days left,
// its effects and what it is
function EventBox({occurrence, today}: {occurrence: EventOccurrence, today: number}) {
    const left = daysLeftInSeason(today)
    return (
        <div className="almanac-event">
            <div className="almanac-event-head">
                <strong>{occurrence.event.name}</strong>
                {isNew(occurrence, today) && <>{" "}<span className="almanac-began">Began</span></>}
                {" "}
                <span className="card-note almanac-event-left">{left + (left == 1 ? " day left" : " days left")}</span>
            </div>
            {" "}
            <span className="almanac-effects">
                {occurrence.event.effects.map((effect, index) => (
                    <span key={effect.label} style={{color: effectColor(effect, true)}}>{(index > 0 ? " " : "") + effectText(effect)}</span>
                ))}
            </span>
            {" "}
            <span className="card-note">{occurrence.event.description}</span>
        </div>
    )
}

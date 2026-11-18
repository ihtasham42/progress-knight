// The Chronicle, in the Settings tab: every life on the world's calendar.
// An overview puts all of them on one axis from the first life to now; a
// list below gives each life a strip of its Summers and Winters, and a lane
// above the strip marking each event it lived through. Every life wakes on
// the same day, so the lives share a start. The life being lived updates live.

import { useState } from "react"
import type { CSSProperties } from "react"
import { DAYS_PER_YEAR, getWorldDay, toDate } from "../game/calendar.ts"
import { calendar, events } from "../game/data.ts"
import { getEventsInSpan, isEventUnlocked, isRare } from "../game/events.ts"
import type { EventOccurrence } from "../game/events.ts"
import { getLifeSpans, toRoman, yearOf } from "../game/history.ts"
import type { LifeSpan } from "../game/history.ts"
import { useGame } from "./gameStore.ts"
import { classNames } from "./classNames.ts"
import { isHistoryShown } from "./Almanac.tsx"

// Lives listed before "Show all"
const RECENT_LIVES = 3

// Blocks on the overview narrower than this (% of the axis) leave out their numeral
const NUMERAL_MIN_WIDTH = 4

// Axis labels: every century, or every 200, 500, 1000, 2000... years, the
// first that keeps them this few
const MAX_TICKS = 6

function getTickStep(years: number): number {
    for (let scale = 100; ; scale *= 10) {
        for (const step of [scale, 2 * scale, 5 * scale]) {
            if (years / step <= MAX_TICKS) return step
        }
    }
}

function plural(count: number, one: string, many: string): string {
    return count + " " + (count == 1 ? one : many)
}

// The axis runs from the first life's waking to a little after now, so the
// marker for now isn't on the edge
export function getAxis(spans: LifeSpan[], today: number): {from: number, to: number} {
    const from = Math.min(...spans.map(span => span.woke))
    const end = Math.max(today, ...spans.map(span => span.ended))
    const to = end + Math.max(DAYS_PER_YEAR, (end - from) * 0.015)
    return {from, to}
}

// Round years for the axis labels, in world days, and where they fall (%)
export function getTicks(from: number, to: number): {year: number, x: number}[] {
    const firstYear = yearOf(from)
    const years = Math.max(1, (to - from) / DAYS_PER_YEAR)
    const step = getTickStep(years)
    const ticks = []
    for (let year = Math.ceil(firstYear / step) * step; ; year += step) {
        const day = (year - calendar.epochYear) * DAYS_PER_YEAR
        const x = (day - from) / (to - from) * 100
        if (x > 92) break
        if (x >= 0) ticks.push({year, x})
    }
    return ticks
}

// A strip of Summers and Winters from one world day to another, as one
// repeating gradient: a year's width, Summer then Winter, lined up so the
// strip starts on the right day of the year
export function getStripStyle(from: number, to: number): CSSProperties {
    const span = Math.max(1, to - from)
    const offset = toDate(from).dayOfYear / span * 100
    let position = -offset
    const stops: string[] = []
    for (const season of calendar.seasons) {
        const color = "var(--pk-stripe-" + season.id + ")"
        const end = position + season.days / span * 100
        stops.push(color + " " + position.toFixed(4) + "%", color + " " + end.toFixed(4) + "%")
        position = end
    }
    return {backgroundImage: "repeating-linear-gradient(90deg, " + stops.join(", ") + ")"}
}

// The events a life lived through that the player can see, earliest first.
// The life being lived counts those that have begun.
function getLifeEvents(span: LifeSpan): EventOccurrence[] {
    return getEventsInSpan(span.woke, span.ended).filter(found => isEventUnlocked(found.event))
}

// "Arcane Conjunction 1522, 1529 · 6 Tournament Summers · 4 Hard Winters":
// rare events with their years first, then how many of each other one
export function getEventSummary(found: EventOccurrence[]): string {
    const parts: string[] = []
    for (const rare of [true, false]) {
        for (const event of events) {
            if (isRare(event) != rare) continue
            const years = found.filter(occurrence => occurrence.event == event).map(occurrence => occurrence.year)
            if (years.length == 0) continue
            if (rare) parts.push(event.name + " " + years.join(", "))
            else parts.push(years.length == 1 ? event.name : years.length + " " + event.plural)
        }
    }
    return parts.join(" · ")
}

function endText(span: LifeSpan): string {
    if (span.living) return "living, age " + span.age
    return (span.end == "evil" ? "embraced evil at " : "touched the eye at ") + span.age
}

function yearsText(span: LifeSpan): string {
    return yearOf(span.woke) + "–" + (span.living ? "now" : yearOf(span.ended))
}

export function Chronicle() {
    useGame()
    const [showAll, setShowAll] = useState(false)
    if (!isHistoryShown()) return null

    const today = getWorldDay()
    const spans = getLifeSpans()
    const {from, to} = getAxis(spans, today)
    const firstYear = yearOf(from)
    const years = yearOf(today) - firstYear
    const rows = Math.max(...spans.map(span => span.row)) + 1
    const toX = (day: number) => (day - from) / (to - from) * 100

    const newestFirst = [...spans].reverse()
    const listed = showAll ? newestFirst : newestFirst.slice(0, RECENT_LIVES)

    return (
        <section id="chronicle" className="settings-card settings-wide chronicle" aria-labelledby="chronicleLabel">
            <div className="settings-line">
                <h2 id="chronicleLabel" tabIndex={-1}>Chronicle</h2>
                <span className="settings-note chronicle-summary">
                    {plural(spans.length, "life", "lives") + " · " + firstYear + " to now · " + plural(years, "year", "years")}
                </span>
            </div>
            <p className="settings-help">Every life you have lived, on the world’s calendar. Each wakes at 14 in Summer {firstYear}.</p>

            <div className="chronicle-overview">
                <div className="chronicle-axis" role="img" aria-label={plural(spans.length, "life", "lives") + " from " + firstYear + " to now"}
                    style={{"--rows": rows} as CSSProperties}>
                    <span aria-hidden="true" className="chronicle-baseline"></span>
                    {spans.map(span => {
                        const width = toX(span.ended) - toX(span.woke)
                        return (
                            <span key={span.life} aria-hidden="true" title={"Life " + toRoman(span.life) + ", " + yearsText(span)}
                                className={classNames("chronicle-block", span.living && "chronicle-block-now")}
                                style={{left: toX(span.woke) + "%", width: width + "%", "--row": span.row} as CSSProperties}>
                                {width >= NUMERAL_MIN_WIDTH ? toRoman(span.life) : ""}
                            </span>
                        )
                    })}
                    <span aria-hidden="true" className="chronicle-now" style={{left: toX(today) + "%"}}></span>
                </div>
                <div aria-hidden="true" className="chronicle-ticks">
                    {getTicks(from, to).map(tick => <span key={tick.year} style={{left: tick.x + "%"}}>{tick.year}</span>)}
                </div>
            </div>

            <div className="chronicle-legend">
                {calendar.seasons.map(season => (
                    <span key={season.id}><span aria-hidden="true" className="chronicle-swatch" style={{backgroundColor: "var(--pk-stripe-" + season.id + ")"}}></span>{season.name}</span>
                ))}
                {events.some(isEventUnlocked) && <>
                    <span><span aria-hidden="true" className="chronicle-swatch chronicle-swatch-event"></span>Event (a season)</span>
                    <span><span aria-hidden="true" className="chronicle-swatch chronicle-swatch-event chronicle-rare"></span>Rare event</span>
                </>}
            </div>

            <ol className="chronicle-list">
                {listed.map(span => (
                    <li key={span.life}>
                        <div className="chronicle-life">
                            <span className="chronicle-title">
                                <strong>{"Life " + span.life + (span.living ? " · now" : "")}</strong>
                                <span className="settings-note">{"Born " + yearOf(span.born) + " · " + endText(span)}</span>
                            </span>
                            <LifeStrip span={span} />
                            <span className={classNames("chronicle-years", span.living && "chronicle-years-now")}>{yearsText(span)}</span>
                        </div>
                    </li>
                ))}
            </ol>
            {newestFirst.length > RECENT_LIVES && (
                <button type="button" className="quiet-button chronicle-more" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
                    {showAll ? "Show recent lives" : "Show all " + newestFirst.length + " lives"}
                </button>
            )}
        </section>
    )
}

// A life's Summers and Winters, a lane above them marking each event it lived
// through (rare ones in gold), and a line naming them
function LifeStrip({span}: {span: LifeSpan}) {
    const found = getLifeEvents(span)
    const length = Math.max(1, span.ended - span.woke)
    const label = plural(Math.floor((span.ended - span.woke) / DAYS_PER_YEAR), "year", "years") + " of Summers and Winters"
        + (found.length ? ", " + plural(found.length, "event", "events") : "")
    const summary = getEventSummary(found)
    return (
        <span className="chronicle-middle">
            <span className="chronicle-track" role="img" aria-label={label}>
                {found.length > 0 && (
                    <span className="chronicle-lane">
                        {found.map(occurrence => {
                            const start = Math.max(occurrence.start, span.woke)
                            const end = Math.min(occurrence.end, span.ended)
                            return <span key={occurrence.event.id + " " + occurrence.year}
                                className={classNames("chronicle-event", isRare(occurrence.event) && "chronicle-rare")}
                                style={{left: (start - span.woke) / length * 100 + "%", width: (end - start) / length * 100 + "%"}}></span>
                        })}
                    </span>
                )}
                <span className="chronicle-strip" style={getStripStyle(span.woke, span.ended)}></span>
            </span>
            {summary && <span className="chronicle-events">{summary}</span>}
        </span>
    )
}

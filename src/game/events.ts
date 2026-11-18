// Events on the world calendar: each lasts a whole season and comes round on
// a fixed schedule (data.ts), so which events run on any day, past or future,
// is worked out from the date and never stored. An event whose unlock hasn't
// been reached has no effect and isn't shown.

import { calendar, events, eventNewDays, namesById } from "./data.ts"
import { gameData } from "./state.ts"
import { getWorldDay, seasonOf, seasonStart, DAYS_PER_YEAR } from "./calendar.ts"
import type { EventDefinition, EventEffect } from "./types.ts"

// One season an event runs for: start is its first day, end the day after
export interface EventOccurrence {
    event: EventDefinition
    year: number
    start: number
    end: number
}

function seasonIndexOf(event: EventDefinition): number {
    return calendar.seasons.findIndex(season => season.id == event.season)
}

// Whether the event comes round in this year (years before the epoch too)
export function happensIn(event: EventDefinition, year: number): boolean {
    const yearsSince = year - calendar.epochYear - event.offset
    return ((yearsSince % event.everyYears) + event.everyYears) % event.everyYears == 0
}

// Rare events, every 7 years or more, stand out in the Chronicle
export function isRare(event: EventDefinition): boolean {
    return event.everyYears >= 7
}

// Whether the player has reached the event's unlock, so it counts and shows
export function isEventUnlocked(event: EventDefinition): boolean {
    if (!event.requires) return true
    return gameData.requirements[namesById[event.requires]].completed
}

function occurrence(event: EventDefinition, year: number): EventOccurrence {
    const start = seasonStart(year, seasonIndexOf(event))
    const season = calendar.seasons[seasonIndexOf(event)]
    return {event, year, start, end: start + season.days}
}

// The events running on a world day, unlocked or not, in data order
export function getEventsOn(worldDay: number): EventOccurrence[] {
    const season = seasonOf(worldDay)
    return events.filter(event => event.season == season.season.id && happensIn(event, season.year))
        .map(event => occurrence(event, season.year))
}

// The events running today that the player has unlocked. Worked out once per
// world day and set of unlocks, as the game asks for it many times a step.
let cachedKey = ""
let cached: EventOccurrence[] = []
export function getActiveEvents(): EventOccurrence[] {
    const day = Math.floor(getWorldDay())
    const key = day + ":" + events.map(event => +isEventUnlocked(event)).join("")
    if (key != cachedKey) {
        cachedKey = key
        cached = getEventsOn(day).filter(occurrence => isEventUnlocked(occurrence.event))
    }
    return cached
}

// Whether an event has only just begun (for the "Began" badge)
export function isNew(occurrence: EventOccurrence, worldDay: number): boolean {
    return Math.floor(worldDay) - occurrence.start < eventNewDays
}

// Every unlocked event that starts after a world day, earliest first (events
// in the same season in data order), at most count of them. Looks a
// century ahead at most.
export function getUpcomingEvents(worldDay: number, count: number): EventOccurrence[] {
    const upcoming: EventOccurrence[] = []
    const shown = events.filter(isEventUnlocked)
    if (shown.length == 0) return upcoming
    let day = seasonOf(worldDay).end
    const last = worldDay + 100 * DAYS_PER_YEAR
    while (upcoming.length < count && day < last) {
        const season = seasonOf(day)
        for (const event of shown) {
            if (event.season == season.season.id && happensIn(event, season.year)) upcoming.push(occurrence(event, season.year))
        }
        day = season.end
    }
    return upcoming.slice(0, count)
}

// Every event, unlocked or not, that runs for any part of a span of world
// days, earliest first
export function getEventsInSpan(from: number, to: number): EventOccurrence[] {
    const found: EventOccurrence[] = []
    if (to <= from) return found
    const firstYear = seasonOf(from).year
    const lastYear = seasonOf(to - 1).year
    for (let year = firstYear; year <= lastYear; year++) {
        for (const event of events) {
            if (!happensIn(event, year)) continue
            const match = occurrence(event, year)
            if (match.end > from && match.start < to) found.push(match)
        }
    }
    return found.sort((a, b) => a.start - b.start)
}

// An event's effect as a multiplier: its effect while the event runs (and is
// unlocked), 1 otherwise. It only changes at the edge of a season.
export function getEventEffect(event: EventDefinition, effect: EventEffect): () => number {
    return () => getActiveEvents().some(running => running.event == event) ? effect.effect : 1
}

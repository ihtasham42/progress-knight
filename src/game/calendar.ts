// The world calendar: turns a world day into a date and lays seasons out
// over a span of days. World day 0 is Summer 1 of the epoch year (data.ts),
// the day the first life wakes. World days before it are earlier years.
// World days are fractional (each game step adds a fraction of a day); a
// date is that of the whole day the world is in.

import { calendar } from "./data.ts"
import { gameData } from "./state.ts"
import type { SeasonDefinition } from "./types.ts"

export const DAYS_PER_YEAR = calendar.seasons.reduce((total, season) => total + season.days, 0)

// Every life wakes at 14, after this many days spent growing up
export const GROWING_UP_DAYS = 365 * 14

// The world day every life wakes on: Summer 1 of the epoch year. The year a
// life reaches depends only on how long it lives.
export const WAKE_DAY = 0

// The world day a life is on at an age in days
export function worldDayAt(days: number): number {
    return WAKE_DAY + days - GROWING_UP_DAYS
}

// Today, as a world day. It follows the age, so it stops when the age stops
// at the lifespan; a rebirth takes it back to the wake day.
export function getWorldDay(): number {
    return worldDayAt(gameData.days)
}

export function getWorldYear(): number {
    return toDate(getWorldDay()).year
}

export interface CalendarDate {
    year: number
    season: SeasonDefinition
    seasonIndex: number // in calendar.seasons
    dayOfSeason: number // from 1
    dayOfYear: number // from 0
}

// One season of one year, as world days: start is its first day, end the
// first day after it
export interface SeasonSpan {
    year: number
    season: SeasonDefinition
    seasonIndex: number
    start: number
    end: number
}

export function toDate(worldDay: number): CalendarDate {
    const day = Math.floor(worldDay)
    const yearsSinceEpoch = Math.floor(day / DAYS_PER_YEAR)
    const dayOfYear = day - yearsSinceEpoch * DAYS_PER_YEAR
    let seasonIndex = 0
    let seasonStartDay = 0
    while (dayOfYear >= seasonStartDay + calendar.seasons[seasonIndex].days) {
        seasonStartDay += calendar.seasons[seasonIndex].days
        seasonIndex++
    }
    return {
        year: calendar.epochYear + yearsSinceEpoch,
        season: calendar.seasons[seasonIndex],
        seasonIndex: seasonIndex,
        dayOfSeason: dayOfYear - seasonStartDay + 1,
        dayOfYear: dayOfYear,
    }
}

// "Summer 42, 1213"
export function formatDate(date: CalendarDate): string {
    return date.season.name + " " + date.dayOfSeason + ", " + date.year
}

// The world day a season of a year starts on
export function seasonStart(year: number, seasonIndex: number): number {
    let day = (year - calendar.epochYear) * DAYS_PER_YEAR
    for (let i = 0; i < seasonIndex; i++) day += calendar.seasons[i].days
    return day
}

// The season a world day falls in
export function seasonOf(worldDay: number): SeasonSpan {
    const date = toDate(worldDay)
    const start = seasonStart(date.year, date.seasonIndex)
    return {year: date.year, season: date.season, seasonIndex: date.seasonIndex, start: start, end: start + date.season.days}
}

// Whole days until the next season starts: the season's length on its first
// day, 1 on its last
export function daysLeftInSeason(worldDay: number): number {
    return seasonOf(worldDay).end - Math.floor(worldDay)
}

// The seasons from one world day up to another, each clipped to the span.
// Empty if the span is empty.
export function seasonsInSpan(from: number, to: number): SeasonSpan[] {
    const spans: SeasonSpan[] = []
    let day = from
    while (day < to) {
        const span = seasonOf(day)
        spans.push({...span, start: Math.max(span.start, from), end: Math.min(span.end, to)})
        day = span.end
    }
    return spans
}

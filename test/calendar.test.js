// The world calendar: world days to dates, and seasons over a span of days.

import { test } from "vitest"
import assert from "node:assert/strict"
import { toDate, formatDate, seasonStart, daysLeftInSeason, seasonsInSpan, DAYS_PER_YEAR } from "../src/game/calendar.ts"

const date = worldDay => formatDate(toDate(worldDay))

test("world day 0 is Summer 1 of the epoch year", async () => {
    assert.equal(date(0), "Summer 1, 1200")
    const start = toDate(0)
    assert.equal(start.year, 1200)
    assert.equal(start.season.id, "summer")
    assert.equal(start.seasonIndex, 0)
    assert.equal(start.dayOfSeason, 1)
    assert.equal(start.dayOfYear, 0)
})

test("Summer turns to Winter after 183 days, and Winter to the next Summer after 182", async () => {
    assert.equal(date(182), "Summer 183, 1200")
    assert.equal(date(183), "Winter 1, 1200")
    assert.equal(date(364), "Winter 182, 1200")
    assert.equal(date(365), "Summer 1, 1201")
    assert.equal(toDate(364).dayOfYear, 364)
    assert.equal(DAYS_PER_YEAR, 365)
})

test("a date is that of the whole day the world is in", async () => {
    assert.equal(date(182.999), "Summer 183, 1200")
    assert.equal(date(183.2), "Winter 1, 1200")
    assert.equal(date(364.9), "Winter 182, 1200")
})

test("days before the epoch are earlier years", async () => {
    assert.equal(date(-1), "Winter 182, 1199")
    assert.equal(date(-0.5), "Winter 182, 1199")
    assert.equal(date(-365), "Summer 1, 1199")
    assert.equal(date(-365 * 14), "Summer 1, 1186")
})

test("very large world days still give exact dates", async () => {
    assert.equal(date(365 * 100000 + 183), "Winter 1, 101200")
    assert.equal(date(365 * 1e9 + 0.25), "Summer 1, 1000001200")
})

test("seasonStart gives the first day of a season", async () => {
    assert.equal(seasonStart(1200, 0), 0)
    assert.equal(seasonStart(1200, 1), 183)
    assert.equal(seasonStart(1213, 1), 13 * 365 + 183)
    assert.equal(seasonStart(1199, 1), -182)
})

test("days left in a season count down to the next one", async () => {
    assert.equal(daysLeftInSeason(0), 183)
    assert.equal(daysLeftInSeason(41.7), 142)
    assert.equal(daysLeftInSeason(182), 1)
    assert.equal(daysLeftInSeason(183), 182)
    assert.equal(daysLeftInSeason(364), 1)
    assert.equal(daysLeftInSeason(-1), 1)
})

test("seasonsInSpan lays seasons out over a span, clipped at both ends", async () => {
    const spans = seasonsInSpan(100, 365 + 200)
    assert.deepEqual(spans.map(span => [span.year, span.season.id, span.start, span.end]), [
        [1200, "summer", 100, 183],
        [1200, "winter", 183, 365],
        [1201, "summer", 365, 548],
        [1201, "winter", 548, 565],
    ])
    assert.deepEqual(seasonsInSpan(10, 10), [])
    assert.deepEqual(seasonsInSpan(10, 5), [])
    assert.equal(seasonsInSpan(-365 * 14, 0).length, 28)
})

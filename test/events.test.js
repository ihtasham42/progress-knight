// Season-long events on the world calendar: the fixed schedule, which run
// today, which come next and which fell in a span of the past.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadEngine } from "./helpers/engine.js"

const YEAR = 365
const WINTER = 183
const ids = occurrences => occurrences.map(found => found.event.id + " " + found.year)

function unlock(game, ...names) {
    for (const name of names) game.gameData.requirements[name].completed = true
}

test("events come round every so many years from the epoch, before it too", async () => {
    const game = await loadEngine()
    const event = id => game.api.events.find(found => found.id == id)
    const years = (id, from, to) => Array.from({ length: to - from }, (_, i) => from + i).filter(year => game.api.happensIn(event(id), year))
    assert.deepEqual(years("tournament_summer", 1195, 1210), [1197, 1200, 1203, 1206, 1209])
    assert.deepEqual(years("hard_winter", 1190, 1211), [1190, 1195, 1200, 1205, 1210])
    assert.deepEqual(years("arcane_conjunction", 1190, 1215), [1193, 1200, 1207, 1214])
    assert.deepEqual(years("blood_moon", 1180, 1230), [1187, 1200, 1213, 1226])
    assert.deepEqual(game.api.events.map(found => game.api.isRare(found)), [false, false, true, true])
})

test("an event runs for the whole of its season", async () => {
    const game = await loadEngine()
    assert.deepEqual(ids(game.api.getEventsOn(0)), ["tournament_summer 1200"])
    assert.deepEqual(ids(game.api.getEventsOn(182.9)), ["tournament_summer 1200"])
    assert.deepEqual(ids(game.api.getEventsOn(WINTER)), ["hard_winter 1200", "arcane_conjunction 1200", "blood_moon 1200"])
    assert.deepEqual(ids(game.api.getEventsOn(YEAR)), [])
    assert.deepEqual(ids(game.api.getEventsOn(5 * YEAR + WINTER + 10)), ["hard_winter 1205"])
    const [hardWinter] = game.api.getEventsOn(5 * YEAR + WINTER + 10)
    assert.deepEqual([hardWinter.start, hardWinter.end], [5 * YEAR + WINTER, 6 * YEAR])
})

test("only events whose unlock has been reached are running", async () => {
    const game = await loadEngine()
    const { gameData } = game
    assert.deepEqual(ids(game.api.getActiveEvents()), [], "a new game knows no events")
    unlock(game, "Military glimpse")
    assert.deepEqual(ids(game.api.getActiveEvents()), ["tournament_summer 1200"])
    gameData.days = 14 * YEAR + WINTER + 3
    assert.deepEqual(ids(game.api.getActiveEvents()), [])
    unlock(game, "Shop", "Arcane glimpse")
    assert.deepEqual(ids(game.api.getActiveEvents()), ["hard_winter 1200", "arcane_conjunction 1200"])
    const [hardWinter] = game.api.getActiveEvents()
    assert.equal(game.api.isNew(hardWinter, game.api.getWorldDay()), true)
    assert.equal(game.api.isNew(hardWinter, WINTER + 19.9), true)
    assert.equal(game.api.isNew(hardWinter, WINTER + 20), false)
})

test("the next events the player can see, earliest first", async () => {
    const game = await loadEngine()
    assert.deepEqual(game.api.getUpcomingEvents(0, 3), [], "none unlocked")
    unlock(game, "Shop")
    assert.deepEqual(ids(game.api.getUpcomingEvents(0, 3)), ["hard_winter 1200", "hard_winter 1205", "hard_winter 1210"])
    unlock(game, "Military glimpse", "Arcane glimpse", "Dark magic")
    assert.deepEqual(ids(game.api.getUpcomingEvents(0, 6)),
        ["hard_winter 1200", "arcane_conjunction 1200", "blood_moon 1200", "tournament_summer 1203", "hard_winter 1205", "tournament_summer 1206"])
    // An event running now isn't upcoming
    assert.deepEqual(ids(game.api.getUpcomingEvents(WINTER + 10, 2)), ["tournament_summer 1203", "hard_winter 1205"])
})

test("the events in a span of days, including ones it only partly covers", async () => {
    const game = await loadEngine()
    assert.deepEqual(ids(game.api.getEventsInSpan(100, 2 * YEAR)),
        ["tournament_summer 1200", "hard_winter 1200", "arcane_conjunction 1200", "blood_moon 1200"])
    assert.deepEqual(ids(game.api.getEventsInSpan(YEAR, 4 * YEAR)), ["tournament_summer 1203"])
    assert.deepEqual(ids(game.api.getEventsInSpan(-YEAR, 0)), [])
    assert.deepEqual(ids(game.api.getEventsInSpan(10, 10)), [])
    assert.equal(game.api.getEventsInSpan(0, 56 * YEAR).length, 19 + 12 + 8 + 5)
})

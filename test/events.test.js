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

// A day in the given year and season of the first life
function setWorldDay(game, day) {
    game.gameData.days = 14 * YEAR + day
}

test("Tournament Summer doubles Military XP while it runs, once Military is in sight", async () => {
    const game = await loadEngine()
    const footman = game.api.getTaskById("footman")
    const farmer = game.api.getTaskById("farmer")
    setWorldDay(game, 50)
    const before = [footman.getXpGain(), farmer.getXpGain()]
    unlock(game, "Military glimpse")
    assert.deepEqual([footman.getXpGain(), farmer.getXpGain()], [before[0] * 2, before[1]])
    setWorldDay(game, YEAR + 50) // Summer 1201: no tournament
    assert.deepEqual([footman.getXpGain(), farmer.getXpGain()], before)
})

test("Hard Winter raises upkeep and skill XP, not job XP", async () => {
    const game = await loadEngine()
    const { gameData } = game
    game.api.setProperty("Tent")
    game.api.setMisc("Book")
    const strength = game.api.getTaskById("strength")
    const farmer = game.api.getTaskById("farmer")
    setWorldDay(game, 5 * YEAR + WINTER + 1)
    const before = { expense: game.api.getExpense(), skill: strength.getXpGain(), job: farmer.getXpGain() }
    assert.ok(before.expense > 0)
    unlock(game, "Shop")
    const tent = gameData.itemData["Tent"], book = gameData.itemData["Book"]
    assert.equal(game.api.getExpense(), Math.round(tent.baseData.expense * 1.25) + Math.round(book.baseData.expense * 1.25))
    // XP gains are rounded to whole points
    assert.ok(Math.abs(strength.getXpGain() - before.skill * 1.5) <= 1, String(strength.getXpGain()))
    assert.ok(strength.getXpGain() > before.skill)
    assert.equal(farmer.getXpGain(), before.job)
    setWorldDay(game, 6 * YEAR + 1) // Summer 1206
    assert.equal(game.api.getExpense(), before.expense)
})

test("Arcane Conjunction triples Magic and Arcane XP; Blood Moon deepens evil gained", async () => {
    const game = await loadEngine()
    const mana = game.api.getTaskById("mana_control")
    const mage = game.api.getTaskById("mage")
    const strength = game.api.getTaskById("strength")
    setWorldDay(game, 7 * YEAR + WINTER + 1)
    const before = [mana.getXpGain(), mage.getXpGain(), strength.getXpGain(), game.api.getEvilGain()]
    unlock(game, "Arcane glimpse", "Dark magic")
    assert.deepEqual([mana.getXpGain(), mage.getXpGain(), strength.getXpGain(), game.api.getEvilGain()],
        [before[0] * 3, before[1] * 3, before[2], before[3]], "1207: a conjunction, no blood moon")
    setWorldDay(game, 13 * YEAR + WINTER + 1)
    assert.equal(game.api.getEvilGain(), before[3] * 1.5, "1213: a blood moon")
    assert.equal(mana.getXpGain(), before[0])
})

test("events that fall together multiply", async () => {
    const game = await loadEngine()
    const mana = game.api.getTaskById("mana_control")
    setWorldDay(game, 35 * YEAR + WINTER + 1) // 1235: Hard Winter and Arcane Conjunction
    const before = mana.getXpGain()
    unlock(game, "Shop", "Arcane glimpse")
    assert.deepEqual(ids(game.api.getActiveEvents()), ["hard_winter 1235", "arcane_conjunction 1235"])
    assert.equal(mana.getXpGain(), Math.round(before * 1.5 * 3))
})

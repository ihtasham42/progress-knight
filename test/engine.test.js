"use strict"

// The game logic runs without a page at all.

const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { loadEngine } = require("./helpers/engine")
const { playLife } = require("./helpers/golden-strategy")

const GOLDEN_FILE = path.join(__dirname, "fixtures", "golden-run.json")

test("the game logic loads with no page, document or window", () => {
    const game = loadEngine()
    assert.equal(game.run("typeof document"), "undefined")
    assert.equal(game.run("typeof window"), "undefined")
    assert.equal(game.gameData.currentJob.name, "Beggar")
})

test("without a page, the golden run's two lives play out exactly as recorded", () => {
    const game = loadEngine()
    game.run("setAutoPromote(true); setAutoLearn(true)")
    const lives = [playLife(game)]
    game.run("rebirthOne()")
    lives.push(playLife(game))

    const golden = JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8"))
    assert.deepEqual(lives, golden)
})

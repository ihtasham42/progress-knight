// The game logic runs without a page at all.

import { test } from "vitest"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { loadEngine } from "./helpers/engine.js"
import { playLife } from "./helpers/golden-strategy.js"

const GOLDEN_FILE = path.join(import.meta.dirname, "fixtures", "golden-run.json")

test("the game logic loads with no page, document or window", () => {
    const game = loadEngine()
    assert.equal(game.run("typeof document"), "undefined")
    assert.equal(game.run("typeof window"), "undefined")
    assert.equal(game.gameData.currentJob.name, "Beggar")
})

test("without a page, the golden run's two lives play out exactly as recorded", () => {
    const game = loadEngine()
    game.api.setAutoPromote(true)
    game.api.setAutoLearn(true)
    const lives = [playLife(game)]
    game.api.rebirthOne()
    lives.push(playLife(game))

    const golden = JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8"))
    assert.deepEqual(lives, golden)
})

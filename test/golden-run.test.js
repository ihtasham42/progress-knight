// Plays two full lives with a fixed strategy and compares the results with a
// recorded run. This locks in game balance: any refactor that changes how the
// game plays, even slightly, will fail this test.
//
// If a change is meant to affect balance, re-record the run with:
//   UPDATE_GOLDEN=1 npm test
// and explain the difference in the commit message.

import { test } from "vitest"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { loadGame } from "./helpers/game.js"
import { playLife } from "./helpers/golden-strategy.js"

const GOLDEN_FILE = path.join(import.meta.dirname, "fixtures", "golden-run.json")

async function play() {
    const game = await loadGame()
    game.setChecked(game.byId("autoPromote"), true)
    game.setChecked(game.byId("autoLearn"), true)
    const lives = [playLife(game)]
    game.api.rebirthOne()
    lives.push(playLife(game))
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
    return lives
}

test("two full lives play out exactly as recorded", async () => {
    const lives = await play()
    if (process.env.UPDATE_GOLDEN) {
        fs.writeFileSync(GOLDEN_FILE, JSON.stringify(lives, null, 2) + "\n")
        return
    }
    const golden = JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8"))
    assert.deepEqual(lives, golden)
})

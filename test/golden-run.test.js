"use strict"

// Plays two full lives with a fixed strategy and compares the results with a
// recorded run. This locks in game balance: any refactor that changes how the
// game plays, even slightly, will fail this test.
//
// If a change is meant to affect balance, re-record the run with:
//   UPDATE_GOLDEN=1 npm test
// and explain the difference in the commit message.

const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { loadGame } = require("./helpers/game")
const { playLife } = require("./helpers/golden-strategy")

const GOLDEN_FILE = path.join(__dirname, "fixtures", "golden-run.json")

function play() {
    const game = loadGame()
    game.window.document.getElementById("autoPromote").checked = true
    game.window.document.getElementById("autoLearn").checked = true
    const lives = [playLife(game)]
    game.run("rebirthOne()")
    lives.push(playLife(game))
    assert.equal(game.errors.length, 0, game.errors.join("\n"))
    return lives
}

test("two full lives play out exactly as recorded", () => {
    const lives = play()
    if (process.env.UPDATE_GOLDEN) {
        fs.writeFileSync(GOLDEN_FILE, JSON.stringify(lives, null, 2) + "\n")
        return
    }
    const golden = JSON.parse(fs.readFileSync(GOLDEN_FILE, "utf8"))
    assert.deepEqual(lives, golden)
})

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

const GOLDEN_FILE = path.join(__dirname, "fixtures", "golden-run.json")
const SHOP_EVERY_TICKS = 100

// Buys the most expensive property, then any misc items, that keep total
// expenses within half of income.
function shop(game) {
    game.run(`(function() {
        const budget = getIncome() / 2
        const unlocked = name => gameData.requirements[name].isCompleted()
        let best = gameData.itemData["Homeless"]
        for (const name of itemCategories["Properties"]) {
            const item = gameData.itemData[name]
            if (unlocked(name) && item.getExpense() <= budget && item.getExpense() >= best.getExpense()) best = item
        }
        gameData.currentProperty = best
        gameData.currentMisc = []
        let spent = best.getExpense()
        for (const name of itemCategories["Misc"]) {
            const item = gameData.itemData[name]
            if (unlocked(name) && spent + item.getExpense() <= budget) {
                gameData.currentMisc.push(item)
                spent += item.getExpense()
            }
        }
    })()`)
}

function playLife(game) {
    let ticks = 0
    while (game.run("isAlive()")) {
        if (ticks % SHOP_EVERY_TICKS == 0) shop(game)
        if (ticks % 20 == 0) game.run("setSkillWithLowestMaxXp()")
        game.fastTicks(1)
        ticks++
    }
    const tasks = {}
    for (const [name, task] of Object.entries(game.gameData.taskData)) {
        if (task.level || task.maxLevel) tasks[name] = [task.level, task.maxLevel]
    }
    return {
        ticks,
        age: game.run("daysToYears(gameData.days)"),
        coins: Math.round(game.gameData.coins),
        job: game.gameData.currentJob.name,
        skill: game.gameData.currentSkill.name,
        property: game.gameData.currentProperty.name,
        misc: Array.from(game.gameData.currentMisc, item => item.name),
        tasks,
    }
}

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

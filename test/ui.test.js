"use strict"

// The page shows the game state; the game logic never touches the page.

const test = require("node:test")
const assert = require("node:assert/strict")
const { loadGame } = require("./helpers/game")

test("the death text is shown once age reaches the lifespan, and hidden after a rebirth", () => {
    const game = loadGame()
    const deathText = game.window.document.getElementById("deathText")
    assert.ok(deathText.classList.contains("hidden"))

    game.run("gameData.days = getLifespan()")
    assert.equal(game.run("isLifeOver()"), true)
    game.run("updateUI()")
    assert.ok(!deathText.classList.contains("hidden"))

    game.run("rebirthOne()")
    game.run("updateUI()")
    assert.ok(deathText.classList.contains("hidden"))
})

test("checking whether the game is alive doesn't touch the page", () => {
    const game = loadGame()
    const deathText = game.window.document.getElementById("deathText")
    game.run("gameData.days = getLifespan() + 100")
    assert.equal(game.run("isAlive()"), false)
    assert.ok(deathText.classList.contains("hidden"))
    assert.equal(game.run("gameData.days"), game.run("getLifespan()"), "the age still stops at the lifespan")
})

for (const rebirth of ["rebirthOne", "rebirthTwo"]) {
    test(`the page goes back to the jobs tab after ${rebirth}()`, () => {
        const game = loadGame()
        const document = game.window.document
        game.run(`setTab(document.getElementById("rebirthTabButton"), "rebirth")`)
        assert.equal(document.getElementById("jobs").style.display, "none")

        game.run(`${rebirth}()`)
        assert.equal(document.getElementById("rebirth").style.display, "block", "the game logic doesn't switch tabs")
        game.run("updateUI()")
        assert.equal(document.getElementById("jobs").style.display, "block")
        assert.equal(document.getElementById("rebirth").style.display, "none")
        assert.ok(document.getElementById("jobTabButton").classList.contains("w3-blue-gray"))
    })
}

test("rendering without a rebirth leaves the chosen tab alone", () => {
    const game = loadGame()
    const document = game.window.document
    game.run(`setTab(document.getElementById("rebirthTabButton"), "rebirth")`)
    game.ticks(3)
    assert.equal(document.getElementById("rebirth").style.display, "block")
})

test("unlocks are recorded by the game step, not by rendering", () => {
    const game = loadGame()
    game.run("gameData.coins = 750")
    game.run("updateUI()")
    assert.equal(game.run("gameData.requirements['Shop'].completed"), false)

    game.fastTicks(1)
    assert.equal(game.run("gameData.requirements['Shop'].completed"), true)
    game.run("updateUI()")
    assert.ok(!game.window.document.getElementById("shopTabButton").classList.contains("hidden"))
})

test("requirements hold only their conditions; the page keeps the elements they reveal", () => {
    const game = loadGame()
    for (const [key, requirement] of Object.entries(game.gameData.requirements)) {
        assert.ok(!("elements" in requirement), key)
    }
    const elements = game.run("requirementElements")
    assert.deepEqual(Object.keys(elements).sort(), Object.keys(game.gameData.requirements).sort())
    // Arrays from the game's window, so compare their contents
    assert.deepEqual(Array.from(elements["Shop"]), [game.window.document.getElementById("shopTabButton")])
    assert.deepEqual(Array.from(elements["Farmer"]), [game.window.document.getElementById("row Farmer")])
})

test("a game step doesn't render; rendering is separate", () => {
    const game = loadGame()
    const coinDisplay = game.window.document.getElementById("coinDisplay")
    const shown = coinDisplay.textContent
    game.fastTicks(10)
    assert.ok(game.gameData.coins > 0)
    assert.equal(coinDisplay.textContent, shown)
    game.run("updateUI()")
    assert.notEqual(coinDisplay.textContent, shown)
})

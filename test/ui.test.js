// The page (the React app, rendered in jsdom) shows the game state; the
// game logic never touches the page.

import { test } from "vitest"
import assert from "node:assert/strict"
import { loadGame } from "./helpers/game.js"

test("the death text is shown once age reaches the lifespan, and hidden after a rebirth", async () => {
    const game = await loadGame()
    const deathText = game.window.document.getElementById("deathText")
    assert.ok(deathText.classList.contains("hidden"))

    game.api.gameData.days = game.api.getLifespan()
    assert.equal(game.api.isLifeOver(), true)
    game.render()
    assert.ok(!deathText.classList.contains("hidden"))

    game.api.rebirthOne()
    game.render()
    assert.ok(deathText.classList.contains("hidden"))
})

test("checking whether the game is alive doesn't touch the page", async () => {
    const game = await loadGame()
    const deathText = game.window.document.getElementById("deathText")
    game.api.gameData.days = game.api.getLifespan() + 100
    assert.equal(game.api.isAlive(), false)
    assert.ok(deathText.classList.contains("hidden"))
    assert.equal(game.api.gameData.days, game.api.getLifespan(), "the age still stops at the lifespan")
})

for (const rebirth of ["rebirthOne", "rebirthTwo"]) {
    test(`the page goes back to the jobs tab after ${rebirth}()`, async () => {
        const game = await loadGame()
        const document = game.window.document
        game.click(document.getElementById("rebirthTabButton"))
        assert.equal(document.getElementById("jobs").style.display, "none")

        game.api[rebirth]()
        assert.equal(document.getElementById("rebirth").style.display, "block", "the game logic doesn't switch tabs")
        game.render()
        assert.equal(document.getElementById("jobs").style.display, "block")
        assert.equal(document.getElementById("rebirth").style.display, "none")
        assert.ok(document.getElementById("jobTabButton").classList.contains("w3-blue-gray"))
    })
}

test("rendering without a rebirth leaves the chosen tab alone", async () => {
    const game = await loadGame()
    const document = game.window.document
    game.click(document.getElementById("rebirthTabButton"))
    game.ticks(3)
    assert.equal(document.getElementById("rebirth").style.display, "block")
})

test("unlocks are recorded by the game step, not by rendering", async () => {
    const game = await loadGame()
    game.api.gameData.coins = 750
    game.render()
    assert.equal(game.api.gameData.requirements['Shop'].completed, false)

    game.fastTicks(1)
    assert.equal(game.api.gameData.requirements['Shop'].completed, true)
    game.render()
    assert.ok(!game.window.document.getElementById("shopTabButton").classList.contains("hidden"))
})

test("requirements hold only their conditions; the page decides what they reveal", async () => {
    const game = await loadGame()
    for (const [key, requirement] of Object.entries(game.gameData.requirements)) {
        assert.ok(!("elements" in requirement), key)
    }
    // The Shop unlock reveals the Shop tab button, and Farmer's own
    // requirement reveals the Farmer row
    assert.ok(game.byId("shopTabButton").classList.contains("hidden"))
    assert.ok(game.byId("row Farmer").classList.contains("hidden"))
    game.gameData.requirements["Shop"].completed = true
    game.gameData.requirements["Farmer"].completed = true
    game.render()
    assert.ok(!game.byId("shopTabButton").classList.contains("hidden"))
    assert.ok(!game.byId("row Farmer").classList.contains("hidden"))
})

test("a game step doesn't render; rendering is separate", async () => {
    const game = await loadGame()
    const coinDisplay = game.window.document.getElementById("coinDisplay")
    const shown = coinDisplay.textContent
    game.fastTicks(10)
    assert.ok(game.gameData.coins > 0)
    assert.equal(coinDisplay.textContent, shown)
    game.render()
    assert.notEqual(coinDisplay.textContent, shown)
})

test("rendering again with nothing changed doesn't touch the page", async () => {
    const game = await loadGame()
    game.ticks(5)
    const observer = new game.window.MutationObserver(() => {})
    observer.observe(game.window.document.body, { subtree: true, childList: true, attributes: true, characterData: true })
    game.render()
    assert.equal(observer.takeRecords().length, 0)

    game.fastTicks(1)
    game.render()
    assert.ok(observer.takeRecords().length > 0, "values that changed are still written")
    observer.disconnect()
})

function gameState(game) {
    const { gameData, skillWithLowestMaxXp } = game.api
    return JSON.stringify({
        save: game.api.serializeGameData(),
        requirements: Object.keys(gameData.requirements).filter(key => gameData.requirements[key].completed),
        automation: [gameData.automation.autoPromote, gameData.automation.autoLearn, [...gameData.automation.skippedSkills]],
        currentMisc: gameData.currentMisc.map(item => item.name),
        skillWithLowestMaxXp: skillWithLowestMaxXp && skillWithLowestMaxXp.name,
        unsteppedTime: game.api.unsteppedTime,
    })
}

test("rendering never changes the game state", async () => {
    const game = await loadGame()
    const renderTwice = () => {
        const before = gameState(game)
        game.render()
        game.render()
        assert.equal(gameState(game), before)
    }

    renderTwice()
    game.ticks(50)
    renderTwice()

    // Unlock conditions met but not yet recorded by a game step
    game.api.gameData.coins = 1e9
    game.api.gameData.evil = 100
    game.api.gameData.days = 365 * 30
    game.task("Concentration").level = 300
    game.task("Meditation").level = 300
    renderTwice()

    game.api.setAutoLearn(true)
    game.api.setSkillSkipped('Strength', true)
    game.api.setSkillWithLowestMaxXp()
    game.api.rebirthOne()
    game.api.gameData.rebirthTwoCount = 3
    renderTwice()

    game.api.gameData.days = game.api.getLifespan() + 1000
    renderTwice()
})

test("automation checkboxes show the game state", async () => {
    const game = await loadGame()
    const document = game.window.document
    game.api.setAutoPromote(true)
    game.api.setAutoLearn(true)
    game.api.setSkillSkipped('Bargaining', true)
    game.render()
    assert.equal(document.getElementById("autoPromote").checked, true)
    assert.equal(document.getElementById("autoLearn").checked, true)
    const skip = name => document.getElementById("row " + name).getElementsByClassName("checkbox")[0]
    assert.equal(skip("Bargaining").checked, true)
    assert.equal(skip("Concentration").checked, false)

    game.api.setAutoLearn(false)
    game.api.setSkillSkipped('Bargaining', false)
    game.render()
    assert.equal(document.getElementById("autoLearn").checked, false)
    assert.equal(skip("Bargaining").checked, false)
})

test("the page's buttons run their actions", async () => {
    const game = await loadGame()
    const document = game.window.document
    const click = id => game.click(document.getElementById(id))

    const skillsTabButton = [...document.getElementsByClassName("tabButton")].find(button => button.textContent == "Skills")
    game.click(skillsTabButton)
    assert.equal(document.getElementById("skills").style.display, "block")
    assert.equal(document.getElementById("jobs").style.display, "none")
    assert.ok(skillsTabButton.classList.contains("w3-blue-gray"))

    click("pauseButton")
    assert.equal(game.gameData.paused, true)
    click("timeWarpingButton")
    assert.equal(game.gameData.timeWarpingEnabled, false)

    click("lightDarkButton")
    assert.ok(!document.getElementById("body").classList.contains("dark"))

    click("exportButton")
    assert.notEqual(document.getElementById("importExportBox").value, "")

    click("rebirthOneButton")
    assert.equal(game.gameData.rebirthOneCount, 1)
    click("rebirthTwoButton")
    assert.equal(game.gameData.rebirthTwoCount, 1)
})

// The part of the page each unlock that isn't a category reveals
const unlockElementIds = {
    shop: "shopTabButton",
    rebirth_tab: "rebirthTabButton",
    rebirth_note_1: "rebirthNote1",
    rebirth_note_2: "rebirthNote2",
    rebirth_note_3: "rebirthNote3",
    evil_info: "evilInfo",
    happiness_info: "happinessInfo",
    time_warping_info: "timeWarping",
    automation: "automation",
    quick_task_display: "quickTaskDisplay",
}

test("every unlock that isn't about categories reveals a part of the page", async () => {
    const game = await loadGame()
    const unlocks = game.api.unlocks.filter(unlock => !unlock.category && !unlock.reveals)
    assert.deepEqual(unlocks.map(unlock => unlock.id).sort(), Object.keys(unlockElementIds).sort())
    for (const unlock of unlocks) {
        const element = game.byId(unlockElementIds[unlock.id])
        assert.ok(element.classList.contains("hidden"), unlock.name + " starts hidden")
        game.gameData.requirements[unlock.name].completed = true
        game.render()
        assert.ok(!element.classList.contains("hidden"), unlock.name + " is shown once unlocked")
    }
})

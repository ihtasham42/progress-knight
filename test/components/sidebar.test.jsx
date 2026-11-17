// @vitest-environment jsdom

// The sidebar: age, coins, income, happiness, evil, time warping, automation
// and the current job and skill.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const byId = id => document.getElementById(id)
const text = id => byId(id).textContent.replace(/\s+/g, " ").trim()
const isHidden = id => byId(id).classList.contains("hidden")

test("age, day and lifespan", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.equal(text("ageDisplay"), "14")
    assert.equal(text("dayDisplay"), "0")
    assert.equal(text("lifespanDisplay"), "70")
    game.gameData.days = 365 * 30 + 100.6
    game.rerender()
    assert.equal(text("ageDisplay"), "30")
    assert.equal(text("dayDisplay"), "100")
})

test("coins are shown in platinum, gold, silver and copper, each in its colour", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    game.gameData.coins = 123456789
    game.rerender()
    const parts = [...byId("coinDisplay").children]
    assert.deepEqual(parts.map(part => part.textContent), ["123p ", "45g ", "67s ", "89c"])
    assert.deepEqual(parts.map(part => part.style.color), ["var(--pk-coin-p)", "var(--pk-coin-g)", "var(--pk-coin-s)", "var(--pk-coin-c)"])
})

test("net income, income and expenses, with the sign of the net", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.equal(text("signDisplay"), "+")
    assert.equal(byId("signDisplay").style.color, "var(--pk-gain)")
    assert.equal(text("incomeDisplay"), "5c")
    assert.equal(text("expenseDisplay"), "0c")
    assert.equal(text("netDisplay"), "5c")

    game.engine.setProperty("Tent")
    game.rerender()
    assert.equal(text("signDisplay"), "-")
    assert.equal(byId("signDisplay").style.color, "var(--pk-loss)")
    assert.equal(text("expenseDisplay"), "15c")
    assert.equal(text("netDisplay"), "10c")
})

test("happiness and evil", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.equal(text("happinessDisplay"), "1.0")
    assert.ok(isHidden("evilInfo"), "evil is hidden until there is some")
    game.engine.rebirthTwo()
    game.ticks(1)
    assert.ok(!isHidden("evilInfo"))
    assert.equal(text("evilDisplay"), "1.0")
})

test("the pause button pauses and plays", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.equal(text("pauseButton"), "Pause")
    fireEvent.click(byId("pauseButton"))
    assert.equal(game.gameData.paused, true)
    assert.equal(text("pauseButton"), "Play")
    fireEvent.click(byId("pauseButton"))
    assert.equal(game.gameData.paused, false)
})

test("time warping is shown once unlocked, with a button to turn it off and on", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.ok(isHidden("timeWarping"))
    game.task("Mage").level = 10
    game.task("Time warping").level = 12
    game.ticks(1)
    assert.ok(!isHidden("timeWarping"))
    assert.equal(text("timeWarpingDisplay"), "x2.00")
    assert.equal(text("timeWarpingButton"), "Disable warp")
    fireEvent.click(byId("timeWarpingButton"))
    assert.equal(game.gameData.timeWarpingEnabled, false)
    assert.equal(text("timeWarpingButton"), "Enable warp")
})

test("the death text is shown once age reaches the lifespan, and hidden after a rebirth", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.ok(isHidden("deathText"))
    game.gameData.days = 365 * 70
    game.rerender()
    assert.ok(!isHidden("deathText"))
    game.engine.rebirthOne()
    game.rerender()
    assert.ok(isHidden("deathText"))
})

test("automation is shown from age 20; its checkboxes show and change the state", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.ok(isHidden("automation"))
    game.gameData.days = 365 * 20
    game.ticks(1)
    assert.ok(!isHidden("automation"))

    assert.equal(byId("autoPromote").checked, false)
    fireEvent.click(byId("autoPromote"))
    assert.equal(game.gameData.automation.autoPromote, true)
    assert.equal(byId("autoPromote").checked, true)

    game.engine.setAutoLearn(true)
    game.rerender()
    assert.equal(byId("autoLearn").checked, true, "the checkbox follows the state")
    fireEvent.click(byId("autoLearn"))
    assert.equal(game.gameData.automation.autoLearn, false)
})

test("the quick task display shows the current job and skill with their levels", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.ok(isHidden("quickTaskDisplay"))
    game.gameData.days = 365 * 20
    game.task("Beggar").level = 3
    game.ticks(1)
    assert.ok(!isHidden("quickTaskDisplay"))
    const names = [...byId("quickTaskDisplay").querySelectorAll(".name")].map(element => element.textContent)
    assert.deepEqual(names, ["Beggar lvl 3", "Concentration lvl 0"])
})

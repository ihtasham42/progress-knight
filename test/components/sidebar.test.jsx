// @vitest-environment jsdom

// The sidebar: coins, income, happiness, evil, time warping, automation and
// the current job and skill.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const byId = id => document.getElementById(id)
const text = id => byId(id).textContent.replace(/\s+/g, " ").trim()
const isHidden = id => byId(id).classList.contains("hidden")

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
    assert.equal(document.querySelector(".purse-net").textContent.replace(/\s+/g, " ").trim(), "+ 5c a day")
    assert.equal(document.querySelector(".purse-notes").textContent.replace(/\s+/g, " ").trim(), "5c earned from Beggar 0c upkeep · Homeless")

    game.engine.setProperty("Tent")
    game.rerender()
    assert.equal(text("signDisplay"), "-")
    assert.equal(byId("signDisplay").style.color, "var(--pk-loss)")
    assert.equal(text("expenseDisplay"), "15c")
    assert.equal(text("netDisplay"), "10c")
    assert.match(document.querySelector(".purse-notes").textContent, /upkeep · Tent$/)

    game.engine.setMisc("Book")
    game.rerender()
    assert.match(document.querySelector(".purse-notes").textContent, /upkeep · Tent, Book$/)
})

test("happiness and evil", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.equal(text("happinessDisplay"), "×1.0")
    assert.ok(isHidden("evilInfo"), "evil is hidden until there is some")
    game.engine.rebirthTwo()
    game.ticks(1)
    assert.ok(!isHidden("evilInfo"))
    assert.equal(text("evilDisplay"), "1.0")
})

test("evil glows only once there is some", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.ok(!byId("evilDisplay").classList.contains("fx-anim"))
    game.engine.rebirthTwo()
    game.ticks(1)
    assert.ok(byId("evilDisplay").classList.contains("fx-anim"))
    assert.ok(byId("evilInfo").querySelector(".stat-evil").classList.contains("fx-anim"))
})

test("happiness lists what multiplies it, leaving out what does nothing", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    const note = () => text("happinessDisplay") && byId("happinessDisplay").closest(".stat").querySelector(".card-note").textContent
    assert.equal(note(), "On all XP")
    game.engine.setProperty("Tent")
    game.task("Meditation").level = 20
    game.rerender()
    assert.equal(text("happinessDisplay"), "×1.7")
    assert.equal(note(), "On all XP · Tent ×1.4, Meditation ×1.2")
})

test("time warping is shown once unlocked, with a button to turn it off and on", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    assert.ok(isHidden("timeWarping"))
    game.task("Mage").level = 10
    game.task("Time warping").level = 12
    game.ticks(1)
    assert.ok(!isHidden("timeWarping"))
    assert.equal(text("timeWarpingDisplay"), "×2.00")
    assert.equal(text("timeWarpingButton"), "Disable warp")
    fireEvent.click(byId("timeWarpingButton"))
    assert.equal(game.gameData.timeWarpingEnabled, false)
    assert.equal(text("timeWarpingButton"), "Enable warp")
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
    assert.deepEqual(names, ["Beggar", "Concentration"])
    const levels = [...byId("quickTaskDisplay").querySelectorAll(".quick-level")].map(element => element.textContent)
    assert.deepEqual(levels, ["lvl 3", "lvl 0"])
})

test("each of them says when it reaches its next level", async () => {
    const game = await renderComponent("Sidebar.tsx", "Sidebar")
    game.gameData.days = 365 * 20
    game.ticks(1)
    const notes = () => [...byId("quickTaskDisplay").querySelectorAll(".card-note")].map(element => element.textContent)
    // 10 xp a day; the first level takes 50 xp for Beggar and 100 for Concentration
    assert.deepEqual(notes(), ["Job · next level in 5 days", "Skill · next level in 10 days"])
    game.task("Beggar").xp = 45
    game.ticks(0)
    assert.equal(notes()[0], "Job · next level in 1 day")
})

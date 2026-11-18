// @vitest-environment jsdom

// The Amulet tab: notes revealed by age, and the two rebirths.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent, screen } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const isHidden = id => document.getElementById(id).classList.contains("hidden")

test("the notes are revealed at 45, 65 and 200", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    assert.ok(screen.getByText(/strange looking amulet on your 25th birthday/))
    assert.deepEqual(["rebirthNote1", "rebirthNote2", "rebirthNote3"].map(isHidden), [true, true, true])
    game.task("Immortality").level = 33 ** 3 - 1 // lifespan x4, so 200 can be reached
    for (const [age, shown] of [[45, [false, true, true]], [65, [false, false, true]], [200, [false, false, false]]]) {
        game.gameData.days = 365 * age
        game.ticks(1)
        assert.deepEqual(["rebirthNote1", "rebirthNote2", "rebirthNote3"].map(isHidden), shown, `age ${age}`)
    }
})

test("touching the eye rebirths", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    game.task("Beggar").level = 20
    fireEvent.click(screen.getByRole("button", { name: "Touch the eye" }))
    assert.equal(game.gameData.rebirthOneCount, 1)
    assert.equal(game.task("Beggar").maxLevel, 20)
})

test("embracing evil shows the evil it would give, and rebirths with it", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    game.task("Evil control").level = 100
    game.task("Blood meditation").level = 50
    game.gameData.days = 365 * 200
    game.ticks(1)
    assert.equal(document.getElementById("evilGainDisplay").textContent, "3.0")
    fireEvent.click(screen.getByRole("button", { name: "Embrace evil" }))
    assert.equal(game.gameData.rebirthTwoCount, 1)
    assert.equal(game.gameData.evil, 3)
})

const text = id => document.getElementById(id).textContent

test("the eye lists the four strongest bonuses of the next life, from max levels and current levels", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    assert.match(text("rebirthNote2"), /Nothing yet/)
    game.task("Beggar").maxLevel = 45
    game.task("Strength").level = 112
    game.task("Concentration").maxLevel = 100
    game.task("Concentration").level = 142
    game.task("Squire").maxLevel = 52
    game.task("Farmer").level = 3
    game.rerender()
    const rows = [...document.querySelectorAll("#rebirthNote2 .amulet-bonus")].map(row => row.textContent)
    assert.deepEqual(rows, ["Concentrationmax 142×15.2", "Strengthmax 112×12.2", "Squiremax 52×6.2", "Beggarmax 45×5.5"])
})

test("the locked teaser shows the road to 200 and what Immortality needs", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    const teaser = document.getElementById("rebirthTeaser")
    assert.ok(teaser.classList.contains("hidden"), "it talks about magic, so waits until magic has been glimpsed")
    game.task("Concentration").level = 100
    game.task("Meditation").level = 100
    game.ticks(1)
    assert.ok(!teaser.classList.contains("hidden"))
    assert.match(teaser.textContent, /Your lifespan is 70\. Immortality is what stretches it\./)
    assert.match(teaser.textContent, /Immortality unlocks with Apprentice mage 10, through the Arcane Association\./)
    assert.equal(teaser.querySelector('[role="img"][aria-label^="Age"]').getAttribute("aria-label"), "Age 14 of 200")

    game.task("Immortality").level = 32
    game.gameData.requirements.Immortality.completed = true
    game.rerender()
    assert.match(teaser.textContent, /Immortality has stretched your lifespan to \d+, ×/)

    game.task("Immortality").level = 33 ** 3 - 1
    game.gameData.days = 365 * 200
    game.ticks(1)
    assert.ok(teaser.classList.contains("hidden"))
})

const pastRows = () => [...document.querySelectorAll("#pastLives [role=row]")].slice(1)
    .map(row => [...row.querySelectorAll("[role=cell]")].map(cell => cell.textContent.trim().replace(/\s+/g, " ")))

test("past lives stay hidden until there is one", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    assert.equal(document.getElementById("pastLives"), null)
    game.task("Beggar").level = 5
    fireEvent.click(screen.getByRole("button", { name: "Touch the eye" }))
    assert.ok(document.getElementById("pastLives"))
})

test("past lives list each life, then the one being lived", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    game.task("Footman").level = 31
    game.task("Strength").level = 112
    game.gameData.days = 365 * 66
    game.gameData.coins = 81200
    fireEvent.click(screen.getByRole("button", { name: "Touch the eye" }))
    game.task("Squire").level = 14
    game.task("Concentration").level = 40
    game.task("Evil control").level = 100
    game.task("Blood meditation").level = 50
    game.task("Immortality").level = 33 ** 3 - 1 // lifespan x4, so 200 can be reached
    game.gameData.days = 365 * 200
    game.gameData.coins = 341
    game.ticks(1)
    fireEvent.click(screen.getByRole("button", { name: "Embrace evil" }))
    game.task("Immortality").level = 0
    game.gameData.lives.push({ life: 3, end: "rebirth", age: 30, job: { id: "gone", level: 2 }, skill: { id: "strength", level: 1 }, peakCoins: 0, evil: 0 })
    game.task("Farmer").level = 7
    game.gameData.coins = 250
    game.ticks(1)

    const rows = pastRows()
    // A purse set just before a game step has earned a little by then
    assert.match(rows[1].splice(4, 1)[0], /^3s \d+c$/)
    assert.match(rows[3].splice(4, 1)[0], /^2s \d+c$/)
    assert.deepEqual(rows, [
        ["1", "1200–1252", "Footman 31", "Strength 112", "8g 12s", "Touched the eye at 66"],
        ["2", "1200–1386", "Squire 14", "Immortality 35936", "Embraced evil at 200 (+3.0 evil)"],
        ["3", "1200–1216", "Unknown 2", "Strength 1", "0c", "Touched the eye at 30"],
        ["3", "1200–now", "Farmer 7", "Concentration 0", "Living"],
    ])
    assert.ok(document.querySelector(".past-living .past-ended"))
    assert.ok(document.querySelector(".past-living .past-years"))
    assert.equal(screen.queryByRole("button", { name: /Show all/ }), null)
})

test("only the 10 latest past lives show until Show all", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    for (let i = 0; i < 14; i++) game.engine.rebirthOne()
    game.ticks(1)
    assert.equal(pastRows().length, 11, "10 past lives and the living one")
    assert.equal(pastRows()[0][0], "5")

    fireEvent.click(screen.getByRole("button", { name: "Show all 14 lives" }))
    assert.equal(pastRows().length, 15)
    assert.equal(pastRows()[0][0], "1")
    assert.equal(pastRows()[14][5], "Living")
    fireEvent.click(screen.getByRole("button", { name: "Show recent lives" }))
    assert.equal(pastRows().length, 11)
})

test("the foot of Touch the eye says when the next life wakes", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    const foot = () => document.querySelector("#rebirthNote2 .amulet-fine").textContent.replace(/\s+/g, " ").trim()
    game.gameData.days = 365 * 66 + 200
    game.rerender()
    // Every life wakes in 1200, however long this one lasts
    assert.equal(foot(), "Resets coins, age, levels and items · you’ll wake at 14 in 1200")
    assert.equal(document.querySelector("#rebirthNote2 .amulet-fine strong").textContent, "you’ll wake at 14 in 1200")
    game.gameData.days = 365 * 70
    game.rerender()
    assert.match(foot(), /in 1200$/)
})

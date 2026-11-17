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

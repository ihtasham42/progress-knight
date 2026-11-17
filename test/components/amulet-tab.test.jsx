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
    fireEvent.click(screen.getByText("Touch the eye"))
    assert.equal(game.gameData.rebirthOneCount, 1)
    assert.equal(game.task("Beggar").maxLevel, 20)
})

test("embracing evil shows the evil it would give, and rebirths with it", async () => {
    const game = await renderComponent("AmuletTab.tsx", "AmuletTab")
    game.task("Evil control").level = 100
    game.task("Blood meditation").level = 50
    game.rerender()
    assert.equal(document.getElementById("evilGainDisplay").textContent, "3.0")
    fireEvent.click(screen.getByText("Embrace evil"))
    assert.equal(game.gameData.rebirthTwoCount, 1)
    assert.equal(game.gameData.evil, 3)
})

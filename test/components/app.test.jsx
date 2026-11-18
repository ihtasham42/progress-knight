// @vitest-environment jsdom

// The page as a whole: the tab bar and switching tabs.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent, screen } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const tab = name => document.getElementById(name)
const tabButton = label => screen.getByText(label, { selector: ".tabButton" })

test("the Jobs tab is open at first", async () => {
    await renderComponent("App.tsx", "App")
    assert.equal(tab("jobs").style.display, "block")
    for (const name of ["skills", "shop", "rebirth", "settings"]) assert.equal(tab(name).style.display, "none", name)
    assert.ok(tabButton("Jobs").classList.contains("w3-blue-gray"))
})

test("clicking a tab button opens that tab", async () => {
    await renderComponent("App.tsx", "App")
    fireEvent.click(tabButton("Skills"))
    assert.equal(tab("skills").style.display, "block")
    assert.equal(tab("jobs").style.display, "none")
    assert.ok(tabButton("Skills").classList.contains("w3-blue-gray"))
    assert.ok(!tabButton("Jobs").classList.contains("w3-blue-gray"))

    fireEvent.click(tabButton("Settings"))
    assert.equal(tab("settings").style.display, "block")
    assert.equal(tab("skills").style.display, "none")
})

test("the Shop and Amulet tab buttons appear once unlocked", async () => {
    const game = await renderComponent("App.tsx", "App")
    assert.ok(tabButton("Shop").classList.contains("hidden"))
    assert.ok(tabButton("Amulet").classList.contains("hidden"))
    assert.ok(!tabButton("Skills").classList.contains("hidden"))

    game.gameData.coins = 750
    game.gameData.days = 365 * 25
    game.ticks(1)
    assert.ok(!tabButton("Shop").classList.contains("hidden"))
    assert.ok(!tabButton("Amulet").classList.contains("hidden"))
})

for (const rebirth of ["rebirthOne", "rebirthTwo"]) {
    test(`the page goes back to the Jobs tab after ${rebirth}()`, async () => {
        const game = await renderComponent("App.tsx", "App")
        fireEvent.click(tabButton("Amulet"))
        assert.equal(tab("rebirth").style.display, "block")

        game.engine[rebirth]()
        assert.equal(tab("rebirth").style.display, "block", "the game logic doesn't switch tabs")
        game.rerender()
        assert.equal(tab("jobs").style.display, "block")
        assert.equal(tab("rebirth").style.display, "none")
        assert.ok(tabButton("Jobs").classList.contains("w3-blue-gray"))
    })
}

test("rendering without a rebirth leaves the chosen tab alone", async () => {
    const game = await renderComponent("App.tsx", "App")
    fireEvent.click(tabButton("Amulet"))
    game.ticks(3)
    assert.equal(tab("rebirth").style.display, "block")
})

test("rendering again with nothing changed doesn't touch the page", async () => {
    const game = await renderComponent("App.tsx", "App")
    game.engine.setAutoLearn(true)
    game.ticks(5)
    const observer = new MutationObserver(() => {})
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
    game.rerender()
    assert.equal(observer.takeRecords().length, 0)

    game.ticks(1)
    assert.ok(observer.takeRecords().length > 0, "values that changed are still written")
    observer.disconnect()
})

test("the Almanac's link opens the Settings tab", async () => {
    const game = await renderComponent("App.tsx", "App")
    game.gameData.days = 365 * 25
    game.ticks(1)
    fireEvent.click(screen.getByRole("button", { name: "Chronicle in Settings" }))
    assert.equal(tab("settings").style.display, "block")
    assert.equal(tab("jobs").style.display, "none")
    assert.ok(tabButton("Settings").classList.contains("w3-blue-gray"))
})

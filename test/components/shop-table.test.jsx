// @vitest-environment jsdom

// The Shop table.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const row = name => document.getElementById("row " + name)
const text = element => element.textContent.replace(/\s+/g, " ").trim()
const button = name => row(name).querySelector("button")
const inUse = name => button(name).getAttribute("aria-pressed") == "true"
// The check mark in the "In use" column, there only while the item is in use
const tick = name => row(name).querySelector(".active")

test("properties and misc items with their effect and expense", async () => {
    await renderComponent("ShopTable.tsx", "ShopTable")
    assert.equal(text(row("Tent").querySelector(".effect")), "×1.4 happiness")
    assert.equal(text(row("Tent").querySelector(".expense")), "15c")
    assert.equal(text(row("Book").querySelector(".effect")), "×1.5 skill xp")
    assert.equal(text(row("Book").querySelector(".expense")), "10c")
    assert.equal(text(row("Book").querySelector(".name")), "Book")
    assert.ok(row("Wooden hut").classList.contains("hidden"), "locked until enough coins")
})

test("the property and items in use are pressed and show a check mark", async () => {
    const game = await renderComponent("ShopTable.tsx", "ShopTable")
    assert.ok(inUse("Homeless") && tick("Homeless"))
    assert.ok(!inUse("Tent") && !tick("Tent"))
    assert.ok(!inUse("Book") && !tick("Book"))
    game.gameData.coins = 100
    game.rerender()
    fireEvent.click(button("Tent"))
    fireEvent.click(button("Book"))
    assert.equal(game.gameData.currentProperty.name, "Tent")
    assert.ok(inUse("Tent") && tick("Tent"))
    assert.ok(!inUse("Homeless") && !tick("Homeless"))
    assert.ok(inUse("Book") && tick("Book"))
    fireEvent.click(button("Book"))
    assert.equal(game.gameData.currentMisc.length, 0, "clicking an item again takes it off")
})

test("items you can't afford can't be bought", async () => {
    const game = await renderComponent("ShopTable.tsx", "ShopTable")
    assert.equal(button("Tent").disabled, true)
    fireEvent.click(button("Tent"))
    assert.equal(game.gameData.currentProperty.name, "Homeless")
    game.gameData.coins = 15
    game.rerender()
    assert.equal(button("Tent").disabled, false)
})

test("the required row says how many coins the next item needs", async () => {
    const game = await renderComponent("ShopTable.tsx", "ShopTable")
    assert.equal(text(document.getElementById("Properties")), "Next: Wooden hut · shows up once you've held Coins 1c / 1g")
    game.gameData.coins = 1000
    game.ticks(1)
    assert.match(text(document.getElementById("Misc")), /^Next: Dumbbells · shows up once you've held Coins 10s .*\/ 50s$/)
})

test("misc items stay out of sight until 10s has been held, then stay", async () => {
    const game = await renderComponent("ShopTable.tsx", "ShopTable")
    const header = () => document.querySelector(".headerRow.Misc")
    assert.ok(header().classList.contains("hidden"))
    assert.ok(row("Book").classList.contains("hidden"))
    assert.equal(document.getElementById("Misc"), null)
    assert.ok(!row("Tent").classList.contains("hidden"), "properties are there from the start")
    game.gameData.coins = 1000
    game.ticks(1)
    assert.ok(!header().classList.contains("hidden"))
    assert.ok(!row("Book").classList.contains("hidden"))
    game.engine.rebirthOne()
    game.ticks(1)
    assert.ok(!header().classList.contains("hidden"))
})

test("the check mark is labelled, and a free item says so", async () => {
    await renderComponent("ShopTable.tsx", "ShopTable")
    assert.equal(tick("Homeless").getAttribute("aria-label"), "In use")
    assert.equal(text(row("Homeless").querySelector(".expense")), "Free")
    assert.equal(row("Homeless").querySelector(".not-in-use"), null)
    assert.equal(row("Tent").querySelector(".not-in-use").getAttribute("aria-label"), "Not in use")
})

test("the footnote gives the upkeep discount, and leaves it out when there is none", async () => {
    const game = await renderComponent("ShopTable.tsx", "ShopTable")
    const note = () => text(document.querySelector(".shop-note"))
    assert.equal(note(), "Upkeep includes your Bargaining discount. Running out of coins makes you homeless and sells every item.")
    game.gameData.itemData.Tent.expenseMultipliers = [() => 0.82]
    game.rerender()
    assert.match(note(), /^Upkeep includes your Bargaining discount \(×0\.82\)\. Running/)
})

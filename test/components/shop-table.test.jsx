// @vitest-environment jsdom

// The Shop table.

import { test } from "vitest"
import assert from "node:assert/strict"
import { fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const row = name => document.getElementById("row " + name)
const text = element => element.textContent.replace(/\s+/g, " ").trim()
const button = name => row(name).querySelector("button")
const active = name => row(name).querySelector(".active").style.backgroundColor

test("properties and misc items with their effect and expense", async () => {
    await renderComponent("ShopTable.tsx", "ShopTable")
    assert.equal(text(row("Tent").querySelector(".effect")), "x1.4 Happiness")
    assert.equal(text(row("Tent").querySelector(".expense")), "15c")
    assert.equal(text(row("Book").querySelector(".effect")), "x1.5 Skill xp")
    assert.equal(text(row("Book").querySelector(".expense")), "10c")
    assert.equal(text(row("Book").querySelector(".name")), "Book")
    assert.ok(row("Wooden hut").classList.contains("hidden"), "locked until enough coins")
})

test("the active property and items are marked in their category colour", async () => {
    const game = await renderComponent("ShopTable.tsx", "ShopTable")
    assert.equal(active("Homeless"), "var(--pk-cat-properties)")
    assert.equal(active("Tent"), "var(--pk-raised)")
    assert.equal(active("Book"), "var(--pk-raised)")
    game.gameData.coins = 100
    game.rerender()
    fireEvent.click(button("Tent"))
    fireEvent.click(button("Book"))
    assert.equal(game.gameData.currentProperty.name, "Tent")
    assert.equal(active("Tent"), "var(--pk-cat-properties)")
    assert.equal(active("Homeless"), "var(--pk-raised)")
    assert.equal(active("Book"), "var(--pk-cat-misc)")
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
    await renderComponent("ShopTable.tsx", "ShopTable")
    assert.equal(text(document.getElementById("Properties")), "Required: 1g")
    assert.equal(text(document.getElementById("Misc")), "Required: 50s")
})

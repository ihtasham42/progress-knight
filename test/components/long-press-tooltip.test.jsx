// @vitest-environment jsdom

// Long press shows a tooltip on screens that can't hover (bars and shop items).

import { afterEach, beforeEach, test, vi } from "vitest"
import assert from "node:assert/strict"
import { act, fireEvent } from "@testing-library/react"
import { renderComponent } from "../helpers/react.js"

const bar = name => document.getElementById("row " + name).querySelector("button")
const isOpen = button => button.classList.contains("tooltip-open")
const wait = ms => act(() => { vi.advanceTimersByTime(ms) })
const press = button => fireEvent.pointerDown(button, {pointerType: "touch", clientX: 5, clientY: 5})
const release = button => fireEvent.pointerUp(button, {pointerType: "touch", clientX: 5, clientY: 5})

// jsdom has no PointerEvent, so the pointer type and position would be lost
class FakePointerEvent extends MouseEvent {
    constructor(type, init = {}) {
        super(type, init)
        this.pointerType = init.pointerType
    }
}

function stubHover(hover) {
    vi.stubGlobal("matchMedia", query => ({matches: query == "(hover: none)" ? !hover : false}))
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("PointerEvent", FakePointerEvent)
    stubHover(false)
})

afterEach(() => {
    vi.useRealTimers()
})

test("a long press shows the tooltip and does not select the task", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    game.task("Beggar").level = 10
    game.ticks(1)
    const button = bar("Farmer")
    assert.ok(!isOpen(button))
    press(button)
    wait(499)
    assert.ok(!isOpen(button), "not yet")
    wait(1)
    assert.ok(isOpen(button))
    release(button)
    fireEvent.click(button)
    assert.ok(isOpen(button))
    assert.equal(game.gameData.currentJob.name, "Beggar")
})

test("a short tap selects and shows no tooltip", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    game.task("Beggar").level = 10
    game.ticks(1)
    const button = bar("Farmer")
    press(button)
    wait(200)
    release(button)
    fireEvent.click(button)
    wait(600)
    assert.ok(!isOpen(button))
    assert.equal(game.gameData.currentJob.name, "Farmer")
})

test("the click after a long press selects nothing", async () => {
    const game = await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    game.task("Beggar").level = 10
    game.ticks(1)
    const button = bar("Farmer")
    press(button)
    wait(500)
    release(button)
    fireEvent.click(button)
    assert.ok(isOpen(button))
    assert.equal(game.gameData.currentJob.name, "Beggar")
    // Later taps select as usual
    wait(1000)
    fireEvent.pointerDown(button, {pointerType: "touch"})
    fireEvent.pointerUp(button, {pointerType: "touch"})
    fireEvent.click(button)
    assert.equal(game.gameData.currentJob.name, "Farmer")
})

test("moving the finger cancels the press", async () => {
    await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    const button = bar("Beggar")
    press(button)
    wait(300)
    fireEvent.pointerMove(button, {pointerType: "touch", clientX: 5, clientY: 40})
    wait(500)
    assert.ok(!isOpen(button))
})

test("the tooltip closes on the next tap anywhere, or after a few seconds", async () => {
    await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    const button = bar("Beggar")
    press(button)
    wait(500)
    release(button)
    assert.ok(isOpen(button))
    fireEvent.pointerDown(document.body, {pointerType: "touch"})
    assert.ok(!isOpen(button))

    press(button)
    wait(500)
    release(button)
    assert.ok(isOpen(button))
    wait(3999)
    assert.ok(isOpen(button))
    wait(1)
    assert.ok(!isOpen(button))
})

test("shop items work the same way", async () => {
    const game = await renderComponent("ShopTable.tsx", "ShopTable")
    game.gameData.coins = 1000
    game.rerender()
    const button = bar("Tent")
    press(button)
    wait(500)
    release(button)
    fireEvent.click(button)
    assert.ok(isOpen(button))
    assert.equal(button.getAttribute("aria-pressed"), "false")
    wait(1000)
    fireEvent.pointerDown(button, {pointerType: "touch"})
    fireEvent.pointerUp(button, {pointerType: "touch"})
    fireEvent.click(button)
    assert.equal(button.getAttribute("aria-pressed"), "true")
})

test("with a mouse or a hover screen nothing changes", async () => {
    await renderComponent("TaskTable.tsx", "TaskTable", { kind: "jobs" })
    const button = bar("Beggar")
    fireEvent.pointerDown(button, {pointerType: "mouse"})
    wait(1000)
    assert.ok(!isOpen(button))
    stubHover(true)
    press(button)
    wait(1000)
    assert.ok(!isOpen(button))
})

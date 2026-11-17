// @vitest-environment jsdom

// The store that tells React components when to show the game state again.

import { test, beforeEach, afterEach } from "vitest"
import assert from "node:assert/strict"
import { act, cleanup, render } from "@testing-library/react"
import { initGameData, update, rebirthOne } from "../src/game/engine.ts"
import { gameData } from "../src/game/state.ts"
import { serializeGameData } from "../src/game/save.ts"
import { getSnapshot, onAnimationFrame, requestRender, renderInterval, subscribe, useGame } from "../src/ui/gameStore.ts"

initGameData()
update()

// React needs to be told it's running in tests to allow act()
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true })
afterEach(cleanup)

test("the frame moves on about 10 times a second of animation frames", async () => {
    assert.equal(renderInterval, 100)
    const start = getSnapshot()
    let rendered = 0
    // One second of 60 Hz animation frames, starting well after the last render
    for (let i = 0; i < 60; i++) {
        if (onAnimationFrame(1e6 + i * 1000 / 60)) rendered++
    }
    assert.ok(rendered >= 9 && rendered <= 11, `${rendered} renders`)
    assert.equal(getSnapshot(), start + rendered)
})

test("requestRender moves the frame on and tells subscribers", async () => {
    let calls = 0
    const unsubscribe = subscribe(() => calls++)
    const before = getSnapshot()
    requestRender()
    assert.equal(getSnapshot(), before + 1)
    assert.equal(calls, 1)
    unsubscribe()
    requestRender()
    assert.equal(calls, 1, "no calls after unsubscribing")
})

function Coins() {
    const game = useGame()
    return <span>{Math.floor(game.coins)}</span>
}

test("a component using useGame shows the state as of the last frame", async () => {
    const { container } = render(<Coins />)
    const shown = container.textContent
    update()
    assert.equal(container.textContent, shown, "game steps alone don't render")
    act(() => requestRender())
    assert.equal(container.textContent, String(Math.floor(gameData.coins)))
})

test("rendering with the store never changes the game state", async () => {
    function Everything() {
        const game = useGame()
        return <span>{JSON.stringify(serializeGameData())}{game.days}</span>
    }
    rebirthOne()
    gameData.coins = 1e9
    const before = JSON.stringify(serializeGameData())
    render(<Everything />)
    act(() => { requestRender(); requestRender() })
    assert.equal(JSON.stringify(serializeGameData()), before)
})

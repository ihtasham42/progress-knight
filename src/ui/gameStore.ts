// Connects the game state to React. The state stays a plain object that the
// game loop changes outside React (see state.ts). React components read it
// directly while rendering; this store only tells them when to render again:
// its snapshot is a frame number, which moves on about 10 times a second and
// whenever the player does something.

import { useSyncExternalStore } from "react"
import { flushSync } from "react-dom"
import { gameData } from "../game/state.ts"
import type { GameData } from "../game/state.ts"

let frame = 0
const listeners = new Set<() => void>()

export function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {listeners.delete(listener)}
}

export function getSnapshot(): number {
    return frame
}

// Shows the current game state on the next render
export function requestRender(): void {
    frame++
    for (const listener of listeners) listener()
}

// Shows the current game state before returning, for tests that read the
// page straight after a game step
export function renderNow(): void {
    flushSync(requestRender)
}

// About 10 frames per second is plenty for numbers and progress bars
export const renderInterval = 100
let lastRenderTime = -Infinity

// Called on every animation frame with its timestamp. Renders if a render
// interval has passed since the last one; returns whether it did.
export function onAnimationFrame(now: number): boolean {
    if (now - lastRenderTime < renderInterval) return false
    lastRenderTime = now
    requestRender()
    return true
}

export function startRendering(): void {
    const loop = (now: number) => {
        onAnimationFrame(now)
        requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
}

// The game state, for a component that shows it. The component renders
// again with every frame. Never change the state while rendering: player
// actions call the engine's functions and then requestRender().
export function useGame(): GameData {
    useSyncExternalStore(subscribe, getSnapshot)
    return gameData
}

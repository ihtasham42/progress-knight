// Renders a React component of the page with a fresh game, for component
// tests (which run with // @vitest-environment jsdom).
//
// Each call gets new copies of the game's modules (vi.resetModules), so no
// state is shared between tests. React itself is shared.

import path from "node:path"
import { afterEach, vi } from "vitest"
import { act, cleanup, render } from "@testing-library/react"
import { createElement } from "react"

const ROOT = path.join(import.meta.dirname, "..", "..")

afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
})

// file: the component's file in src/ui (e.g. "App.tsx"); component: its
// export (e.g. "App")
async function renderComponent(file, component, props = {}) {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    vi.resetModules()
    const engine = await import(path.join(ROOT, "src/game/engine.ts"))
    const { gameData } = await import(path.join(ROOT, "src/game/state.ts"))
    const store = await import(path.join(ROOT, "src/ui/gameStore.ts"))
    const module = await import(path.join(ROOT, "src/ui", file))

    // A new game, as the page starts one
    engine.initGameData()
    engine.update()

    const view = render(createElement(module[component], props))
    return {
        ...view,
        engine,
        gameData,
        task: name => gameData.taskData[name],
        // Shows the current game state, as the render timer would
        rerender: () => act(() => store.requestRender()),
        // Game steps, then a render
        ticks(count) {
            for (let i = 0; i < count; i++) engine.update()
            act(() => store.requestRender())
        },
    }
}

export { renderComponent }
